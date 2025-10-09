    // src/components/SimulationControls.jsx
import React, { useState } from "react";

export default function SimulationControls({ setSimulationResult }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [initialDir, setInitialDir] = useState("N2S");
  const [policy, setPolicy] = useState("time");
  const [speed, setSpeed] = useState(40);
  const [lanes, setLanes] = useState(2);
  const [satFlow, setSatFlow] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSimulationResult(null);

    try {
      const payload = {
        start,
        end,
        initial_direction: initialDir,
        policy,
        policy_config: {},
        sim_params: {
          avg_speed_kmph: Number(speed),
          n_lanes_active: Number(lanes),
          sat_flow_per_lane_per_min: Number(satFlow),
          switch_clearance_min: 120
        }
      };

      const resp = await fetch("http://127.0.0.1:8000/api/run-simulation/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Error ejecutando simulación");
      } else {
        setSimulationResult(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: "1px solid #aaa", padding: "1rem", borderRadius: "5px", marginBottom: "1rem" }}>
      <h2>Configuración de Simulación</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>Inicio (ISO): </label>
          <input type="text" value={start} onChange={e => setStart(e.target.value)} placeholder="YYYY-MM-DDTHH:MM" required/>
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>Fin (ISO): </label>
          <input type="text" value={end} onChange={e => setEnd(e.target.value)} placeholder="YYYY-MM-DDTHH:MM" required/>
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>Dirección inicial: </label>
          <select value={initialDir} onChange={e => setInitialDir(e.target.value)}>
            <option value="N2S">Norte → Sur</option>
            <option value="S2N">Sur → Norte</option>
          </select>
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>Política: </label>
          <select value={policy} onChange={e => setPolicy(e.target.value)}>
            <option value="time">Por horario</option>
            <option value="demand">Por demanda</option>
          </select>
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>Velocidad media (km/h): </label>
          <input type="number" value={speed} onChange={e => setSpeed(e.target.value)} />
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>Carriles activos: </label>
          <input type="number" value={lanes} onChange={e => setLanes(e.target.value)} />
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>Saturación por carril (veh/min): </label>
          <input type="number" value={satFlow} onChange={e => setSatFlow(e.target.value)} />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Simulando..." : "Ejecutar Simulación"}
        </button>
      </form>

      {error && <div style={{ color: "red", marginTop: "1rem" }}>{error}</div>}
    </div>
  );
}
