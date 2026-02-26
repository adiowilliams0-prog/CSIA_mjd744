import React, { useState, useEffect } from 'react';
import { 
    getActiveStaff, 
    lookupVehicle, 
    getVehicleCategories, 
    getActiveServices, 
    submitWorksheet,
    createVehicle 
} from '../api/api';
import './DailyWorksheet.css';

const DailyWorksheet = () => {
    // --- 1. STATE MANAGEMENT ---
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [lookupPerformed, setLookupPerformed] = useState(false); // New state to track lookup status
    
    // Data fetched from backend
    const [staffList, setStaffList] = useState([]);
    const [categories, setCategories] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);

    // Master form state
    const [formData, setFormData] = useState({
        selectedEmployeeIds: [],
        vehicle_id: null,
        plate: '',
        make_model: '',
        vehicle_category_id: '',
        plan_active: false,
        selectedServiceIds: [],
        discount: 0,
        discount_reason: '',
        fee: 0,
        fee_reason: '',
        payment_method: ''
    });

    // --- 2. INITIAL DATA LOAD ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [staff, cats, svcs] = await Promise.all([
                    getActiveStaff(),
                    getVehicleCategories(),
                    getActiveServices()
                ]);
                setStaffList(staff);
                setCategories(cats);
                setAvailableServices(svcs);
            } catch (err) {
                console.error("Initialization error:", err);
            }
        };
        fetchInitialData();
    }, []);

    // --- 3. HELPER LOGIC ---
    const resetWizard = () => {
        if (window.confirm("Are you sure? All progress will be lost.")) {
            window.location.reload();
        }
    };

    const normalizePlate = (p) => p.replace(/[\s-]/g, "").toUpperCase();

    // Calculate live price based on selected services + category
    const calculateLivePrice = () => {
        let baseTotal = 0;
        formData.selectedServiceIds.forEach(id => {
            const service = availableServices.find(s => s.service_id === id);
            // Pricing logic: find the price for this service specific to the vehicle category
            const priceObj = service?.pricing?.find(p => p.vehicle_category_id === parseInt(formData.vehicle_category_id));
            baseTotal += priceObj ? parseFloat(priceObj.base_price) : 0;
        });
        const total = baseTotal - parseFloat(formData.discount || 0) + parseFloat(formData.fee || 0);
        return Math.max(0, total).toFixed(2);
    };

    // --- 4. NAVIGATION & VALIDATION ---
    const nextStep = async () => {
        if (step === 1 && formData.selectedEmployeeIds.length === 0) {
            return alert("Please select at least one staff member.");
        }
        if (step === 3 && formData.selectedServiceIds.length === 0) {
            return alert("Please select at least one service.");
        }
        if (step === 5 && !formData.payment_method) {
            return alert("Please select a payment method.");
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    // --- 5. STEP SPECIFIC HANDLERS ---
    
    // Step 2: Vehicle Lookup/Creation
    const handleVehicleLookup = async () => {
        const cleanPlate = normalizePlate(formData.plate);
        if (!cleanPlate) return alert("Please enter a plate.");

        setLoading(true);
        
        // --- NEW LOGIC: Reset previous vehicle state before searching ---
        setFormData(prev => ({
            ...prev,
            vehicle_id: null,
            make_model: '',
            vehicle_category_id: '',
            plan_active: false,
            selectedServiceIds: [], // Optional: reset services if a new car is looked up
            client_plan_id: null
        }));
        setLookupPerformed(false); 
        // ---------------------------------------------------------------

        try {
            const result = await lookupVehicle(cleanPlate);
            if (result) {
                setFormData(prev => ({
                    ...prev,
                    vehicle_id: result.vehicle_id,
                    make_model: result.make_model,
                    vehicle_category_id: parseInt(result.vehicle_category_id),
                    plan_active: result.plan_active || false,
                    payment_method: result.plan_active ? 'plan' : prev.payment_method, // Auto-select plan if active
                    client_plan_id: result.client_plan_id
                }));
                setLookupPerformed(true);
            } else {
                // No vehicle found: lookupPerformed stays false, 
                // allowing the "Create Vehicle" form to show
                setLookupPerformed(true); 
            }
        } catch (err) {
            console.error("Lookup error:", err);
            alert("Error looking up vehicle.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateVehicle = async () => {
        if (!formData.vehicle_category_id) {
            return alert("Category is required.");
        }
        setLoading(true);
        try {
            const newVehicle = await createVehicle({
                plate: normalizePlate(formData.plate),
                make_model: formData.make_model,
                category_id: parseInt(formData.vehicle_category_id)
            });
            setFormData(prev => ({ 
                ...prev, 
                vehicle_id: newVehicle.vehicle_id, 
                vehicle_category_id: parseInt(formData.vehicle_category_id),
                plan_active: false 
            }));
            // Transition to step 3 automatically after creation
            setStep(3);
        } catch (err) {
            alert("Error creating vehicle.");
        } finally {
            setLoading(false);
        }
    };



    // Final Submission
    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                // FIX 1: Send 'plate' instead of 'vehicle_id' 
                plate: normalizePlate(formData.plate), 
                
                // FIX 2: Ensure all IDs are integers 
                employee_ids: formData.selectedEmployeeIds.map(id => parseInt(id)),
                service_ids: formData.selectedServiceIds.map(id => parseInt(id)),
                
                // FIX 3: Ensure numeric values are floats/decimals 
                discount: parseFloat(formData.discount || 0),
                discount_reason: formData.discount_reason,
                fee: parseFloat(formData.fee || 0),
                fee_reason: formData.fee_reason,
                payment_method: formData.payment_method
            };

            await submitWorksheet(payload);
            alert("Transaction successful!");
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Submission failed. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    // --- 6. RENDER COMPONENTS ---
    return (
        <div className="worksheet-wizard">
            <header className="wizard-header">
                <h2>Daily Worksheet — Step {step} of 6</h2>
                <div className="live-price-badge">Total: ${calculateLivePrice()}</div>
            </header>

            {/* STEP 1: STAFF */}
            {step === 1 && (
                <div className="step-container">
                    <h3>Select Staff</h3>
                    {staffList.length === 0 ? (
                        <p>Loading active staff or no staff found...</p>
                    ) : (
                        <div className="staff-grid">
                            {staffList.map(s => {
                                // Safety check: Ensure we have an ID to compare against
                                const isSelected = formData.selectedEmployeeIds.includes(s.user_id);
                                    return (
                                        <label 
                                            key={s.user_id} 
                                            className={`selectable-card ${isSelected ? 'selected' : ''}`}
                                        >
                                            <input 
                                                type="checkbox"
                                                // 2. Tie 'checked' ONLY to this individual employee's status
                                                checked={isSelected} 
                                                onChange={(e) => {
                                                    const id = s.user_id;
                                                    let updatedIds = [...formData.selectedEmployeeIds];

                                                    if (e.target.checked) {
                                                        // Add if not present
                                                        if (!updatedIds.includes(id)) {
                                                            updatedIds.push(id);
                                                        }
                                                    } else {
                                                        // Filter out the ID if unchecked
                                                        updatedIds = updatedIds.filter(empId => empId !== id);
                                                    }

                                                    // 3. Update the specific key in formData
                                                    setFormData({
                                                        ...formData,
                                                        selectedEmployeeIds: updatedIds
                                                    });
                                                }}
                                        />
                                        {/* Ensure these property names match your backend model */}
                                        <span>{s.full_name} </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* STEP 2: VEHICLE LOOKUP/CREATE */}
            {step === 2 && (
                <div className="step-container">
                    <h3>Vehicle Information</h3>
                    
                    {/* Always show Plate Input */}
                    <div className="lookup-section">
                        <label>License Plate</label>
                        <div className="input-with-button">
                            <input 
                                className="main-input"
                                placeholder="License Plate (e.g. ABC1234)" 
                                value={formData.plate} 
                                onChange={e => {
                                    setFormData({...formData, plate: e.target.value.toUpperCase()});
                                    setLookupPerformed(false); // Reset if they start typing again
                                }}
                            />
                            <button className="btn-action" onClick={handleVehicleLookup} disabled={loading}>
                                {loading ? "Searching..." : "Lookup"}
                            </button>
                        </div>
                    </div>

                    {/* Case 1: Vehicle Found */}
                    {formData.vehicle_id && (
                        <div className="vehicle-info-card success">
                            <p><strong>Vehicle:</strong> {formData.make_model}</p>
                            <p><strong>Category:</strong> {categories.find(c => c.vehicle_category_id === parseInt(formData.vehicle_category_id))?.category_name || "N/A"}</p>
                            {formData.plan_active && (
                                <p className="plan-tag"><strong>Active Plan ID:</strong> {formData.client_plan_id}</p>
                            )}
                            <button className="btn-small" onClick={() => {
                                setFormData({...formData, vehicle_id: null});
                                setLookupPerformed(false);
                            }}>Change Vehicle</button>
                        </div>
                    )}

                    {/* Case 2: Lookup performed but nothing found -> Show Create form */}
                    {lookupPerformed && !formData.vehicle_id && (
                        <div className="create-vehicle-section">
                            <h4 className="warning-text">Vehicle not found. Register new vehicle:</h4>
                            <div className="input-group">
                                <input 
                                    placeholder="Make/Model (e.g. Toyota Corolla)" 
                                    value={formData.make_model} 
                                    onChange={e => setFormData({...formData, make_model: e.target.value})} 
                                />
                                <select 
                                    value={formData.vehicle_category_id} 
                                    onChange={e => setFormData({...formData, vehicle_category_id: parseInt(e.target.value)})}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c.vehicle_category_id} value={c.vehicle_category_id}>{c.category_name}</option>)}
                                </select>
                            </div>
                            <button className="btn-action primary" onClick={handleCreateVehicle} disabled={loading}>
                                Create & Continue
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 3: SERVICES */}
            {step === 3 && (
                <div className="step-container">
                    <h3>Select Services</h3>
                    <div className="service-list">
                        {availableServices.map(svc => {
                            const price = svc.pricing?.find(p => p.vehicle_category_id === parseInt(formData.vehicle_category_id))?.base_price || "0.00";
                            return (
                                <label key={svc.service_id} className="service-item">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.selectedServiceIds.includes(svc.service_id)}
                                        onChange={(e) => {
                                            const ids = e.target.checked 
                                                ? [...formData.selectedServiceIds, svc.service_id]
                                                : formData.selectedServiceIds.filter(id => id !== svc.service_id);
                                            setFormData({...formData, selectedServiceIds: ids});
                                        }}
                                    />
                                    <span>{svc.service_name}</span>
                                    <span className="price-tag">${price}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* STEP 4: ADJUSTMENTS */}
            {step === 4 && (
                <div className="step-container">
                    <h3>Adjustments</h3>
                    <div className="input-group">
                        <label>Discount Amount ($)</label>
                        <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} />
                        <input placeholder="Discount Reason" value={formData.discount_reason} onChange={e => setFormData({...formData, discount_reason: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label>Extra Fee ($)</label>
                        <input type="number" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} />
                        <input placeholder="Fee Reason" value={formData.fee_reason} onChange={e => setFormData({...formData, fee_reason: e.target.value})} />
                    </div>
                </div>
            )}

            {/* STEP 5: PAYMENT */}
            {step === 5 && (
                <div className="step-container">
                    <h3>Payment Method</h3>
                    {formData.plan_active && (
                        <div className="banner-info">Active Plan Detected! Payment locked to Plan.</div>
                    )}
                    <select 
                        className="main-input"
                        disabled={formData.plan_active} 
                        value={formData.payment_method} 
                        onChange={e => setFormData({...formData, payment_method: e.target.value})}
                    >
                        <option value="">Select Payment</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        {!formData.plan_active && <option value="plan" disabled>Plan (No active plan)</option>}
                        {formData.plan_active && <option value="plan">Plan</option>}
                    </select>
                </div>
            )}

            {/* STEP 6: SUMMARY */}
            {step === 6 && (
                <div className="step-container summary-step">
                    <h3>Review & Submit</h3>
                    <div className="summary-box">
                        <p><strong>Staff:</strong> {formData.selectedEmployeeIds.map(id => staffList.find(s => s.user_id === id)?.full_name).join(', ')}</p>
                        <p><strong>Vehicle:</strong> {formData.plate} ({formData.make_model})</p>
                        <p><strong>Services:</strong> {formData.selectedServiceIds.map(id => availableServices.find(s => s.service_id === id)?.service_name).join(', ')}</p>
                        <p><strong>Payment:</strong> {formData.payment_method.toUpperCase()}</p>
                        <h4 className="final-total">Total: ${calculateLivePrice()}</h4>
                    </div>
                </div>
            )}

            {/* FOOTER NAVIGATION */}
            <footer className="wizard-footer">
                <button className="btn-cancel" onClick={resetWizard}>CANCEL</button>
                <div className="nav-right">
                    {step > 1 && <button onClick={prevStep}>PREVIOUS</button>}
                    {step < 6 ? (
                        <button className="btn-next" onClick={nextStep} disabled={step === 2 && !formData.vehicle_id}>NEXT</button>
                    ) : (
                        <button className="btn-submit" onClick={handleFinalSubmit} disabled={loading}>SUBMIT TRANSACTION</button>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default DailyWorksheet;