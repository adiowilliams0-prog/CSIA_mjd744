import React, { useState, useEffect, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  getClientPlans,
  createClientPlan,
  addVehicleToPlan,
  getVehicleCategories
} from "../api/api";
import "./ClientPlans.css";

/* -------------------------------
   Utility: Plate Normalization
--------------------------------*/
const normalizePlate = (plate) =>
  plate.replace(/[\s-]/g, "").toUpperCase();

/* ===============================
   ClientPlans Component
=================================*/
const ClientPlans = () => {

  /* -------------------------------
     State
  --------------------------------*/
  const [plans, setPlans] = useState([]);
  const [categories, setCategories] = useState([]);   // ✅ NEW
  const [loading, setLoading] = useState(true);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  const [currentPlan, setCurrentPlan] = useState(null);
  const [vehiclePlanId, setVehiclePlanId] = useState(null);

  const signatureRef = useRef(null);

  const [planForm, setPlanForm] = useState({
    client_name: "",
    billing_cycle: "weekly",
    email: "",
    phone: "",
  });

  const [vehicleForm, setVehicleForm] = useState({
    plate: "",
    category_id: "",
    make_model: "",
  });

  /* -------------------------------
     Fetch Plans
  --------------------------------*/
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await getClientPlans();
      setPlans(data);
    } catch (err) {
      alert("Failed to load client plans.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------
     Fetch Vehicle Categories ✅
  --------------------------------*/
  const fetchCategories = async () => {
    try {
      const data = await getVehicleCategories();
      setCategories(data);
    } catch (err) {
      alert("Failed to load vehicle categories.");
    }
  };

  /* -------------------------------
     Load Data On Mount
  --------------------------------*/
  useEffect(() => {
    fetchPlans();
    fetchCategories();
  }, []);

  /* ===============================
     PLAN MODAL
  =================================*/

  const openPlanModal = (plan = null) => {
    setCurrentPlan(plan);

    if (plan) {
      setPlanForm({
        client_name: plan.client_name,
        billing_cycle: plan.billing_cycle_type,
        email: plan.contact_email || "",
        phone: plan.contact_phone || "",
      });
    } else {
      setPlanForm({
        client_name: "",
        billing_cycle: "weekly",
        email: "",
        phone: "",
      });
    }

    setTimeout(() => {
      if (signatureRef.current) signatureRef.current.clear();
    }, 0);

    setShowPlanModal(true);
  };

  const handlePlanSave = async (e) => {
    e.preventDefault();

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert("Signature is required.");
      return;
    }

    const canvas = signatureRef.current.getCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const base64Signature = dataUrl.split(",")[1];

    try {
      await createClientPlan({
        ...planForm,
        signature: base64Signature
      });

      setShowPlanModal(false);
      fetchPlans();
    } catch (err) {
      alert("Error saving plan.");
    }
  };

  /* ===============================
     VEHICLE MODAL
  =================================*/

  const openVehicleModal = (planId) => {
    setVehiclePlanId(planId);

    // ✅ Dynamic default category
    setVehicleForm({
      plate: "",
      category_id: categories.length
        ? categories[0].vehicle_category_id
        : "",
      make_model: "",
    });

    setShowVehicleModal(true);
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();

    const normalizedPlate = normalizePlate(vehicleForm.plate);

    if (!normalizedPlate) {
      alert("Invalid plate.");
      return;
    }

    try {
      await addVehicleToPlan(vehiclePlanId, {
        plate: normalizedPlate,
        category_id: vehicleForm.category_id,
        make_model: vehicleForm.make_model,
      });

      setShowVehicleModal(false);
      fetchPlans();
    } catch (err) {
      alert("Error adding vehicle.");
    }
  };

  /* ===============================
     UI
  =================================*/

  if (loading) {
    return <div className="client-plans-page">Loading...</div>;
  }

  return (
    <div className="client-plans-page">

      {/* HEADER */}
      <div className="cp-header">
        <h1>Client Plans</h1>
        <button
          className="btn-primary"
          onClick={() => openPlanModal()}
        >
          + Add New Plan
        </button>
      </div>

      {/* TABLE */}
      <table className="cp-table">
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Billing Cycle</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Vehicles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.client_plan_id}>
              <td>{plan.client_name}</td>
              <td>{plan.billing_cycle_type}</td>
              <td>{plan.contact_email}</td>
              <td>{plan.contact_phone}</td>
              <td>
                <span
                  className={`status-badge ${
                    plan.is_active
                      ? "status-active"
                      : "status-inactive"
                  }`}
                >
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td>{plan.vehicle_count}</td>
              <td>
                <button onClick={() => openPlanModal(plan)}>
                  Edit
                </button>{" "}
                <button
                  onClick={() =>
                    openVehicleModal(plan.client_plan_id)
                  }
                >
                  Manage Vehicles
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===============================
          VEHICLE MODAL
      ================================*/}
      {showVehicleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Vehicle</h2>

            <form onSubmit={handleAddVehicle}>

              <input
                type="text"
                placeholder="License Plate"
                required
                value={vehicleForm.plate}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    plate: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Make / Model"
                value={vehicleForm.make_model}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    make_model: e.target.value,
                  })
                }
              />

              {/* ✅ Category Dropdown */}
              <select
                value={vehicleForm.category_id}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    category_id: parseInt(e.target.value),
                  })
                }
                required
              >
                {categories.map((cat) => (
                  <option
                    key={cat.vehicle_category_id}
                    value={cat.vehicle_category_id}
                  >
                    {cat.category_name}
                  </option>
                ))}
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() =>
                    setShowVehicleModal(false)
                  }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Vehicle
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientPlans;