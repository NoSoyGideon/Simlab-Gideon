import React, { useEffect, useRef } from "react";

export default function SimulationResults({ result }) {
  const canvasRef = useRef(null);

  const { metrics, history_preview, full_history_length } = result;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!history_preview || history_preview.length === 0) return;

    const margin = 40;

    // Máximos para normalizar
    const maxQueue = Math.max(...history_preview.map(h => Math.max(h.N2S_queue, h.S2N_queue)));
    const maxExit = Math.max(...history_preview.map(h => Math.max(h.N2S_exited, h.S2N_exited)));

    const xScale = (width - 2 * margin) / history_preview.length;
    const yScaleQueue = (height/2 - margin) / maxQueue;
    const yScaleExit = (height/2 - margin) / maxExit;

    // Dibujar ejes
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    // Cola eje izquierdo
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height/2 - margin);
    ctx.lineTo(width - margin, height/2 - margin);
    // Flujo eje derecho
    ctx.moveTo(margin, height/2 + margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();

    // Función para dibujar línea
    function drawLine(color, key, yOffset, scale) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      history_preview.forEach((h, i) => {
        const x = margin + i * xScale;
        const y = yOffset - h[key] * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Cola
    drawLine("red", "N2S_queue", height/2 - margin, yScaleQueue);
    drawLine("blue", "S2N_queue", height/2 - margin, yScaleQueue);

    // Salidas
    drawLine("red", "N2S_exited", height - margin, yScaleExit);
    drawLine("blue", "S2N_exited", height - margin, yScaleExit);

    // Alertas de congestión (colas > 80% capacidad)
    const capacity = 30; // ejemplo, 30 veh/min por carril
    history_preview.forEach((h, i) => {
      if (h.N2S_queue > 0.8 * capacity) {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(margin + i * xScale, height/2 - margin - h.N2S_queue * yScaleQueue, 3, 0, 2*Math.PI);
        ctx.fill();
      }
      if (h.S2N_queue > 0.8 * capacity) {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(margin + i * xScale, height/2 - margin - h.S2N_queue * yScaleQueue, 3, 0, 2*Math.PI);
        ctx.fill();
      }
    });

    // Leyenda
    ctx.fillStyle = "red"; ctx.fillRect(width - 160, 10, 10, 10);
    ctx.fillStyle = "black"; ctx.fillText("N2S cola / salidas", width - 140, 20);
    ctx.fillStyle = "blue"; ctx.fillRect(width - 160, 30, 10, 10);
    ctx.fillStyle = "black"; ctx.fillText("S2N cola / salidas", width - 140, 40);
    ctx.fillStyle = "red"; ctx.fillRect(width - 160, 50, 10, 10);
    ctx.fillStyle = "black"; ctx.fillText("Alerta congestión", width - 140, 60);

  }, [history_preview]);

  return (
    <div style={{ border: "1px solid #aaa", padding: "1rem", borderRadius: "5px", marginTop: "1rem" }}>
      <h2>Resultados de la Simulación</h2>

      {/* Métricas por sentido */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        {["N2S","S2N"].map(dir => (
          <div key={dir} style={{
            border: "1px solid #ccc",
            padding: "0.5rem",
            borderRadius: "5px",
            width: "48%",
            backgroundColor: metrics[dir]?.avg_time_in_system_min > 15 ? "#fdd" : "#dfd"
          }}>
            <h3>{dir === "N2S" ? "Norte → Sur" : "Sur → Norte"}</h3>
            <p>Total llegadas: {metrics[dir]?.total_arrivals ?? "-"}</p>
            <p>Total servidos: {metrics[dir]?.total_served ?? "-"}</p>
            <p>Total salidos: {metrics[dir]?.total_exited ?? "-"}</p>
            <p>Tiempo medio en sistema (min): {metrics[dir]?.avg_time_in_system_min?.toFixed(2) ?? "-"}</p>
            <p>Longitud media de cola (veh): {metrics[dir]?.avg_queue_length?.toFixed(2) ?? "-"}</p>
          </div>
        ))}
      </div>

      <h3>Historial gráfico</h3>
      <canvas ref={canvasRef} width={800} height={400} style={{ border: "1px solid #000" }} />

      <h3>Detalle histórico (primeros 20 registros)</h3>
      <div style={{ maxHeight: 200, overflowY: "scroll", background: "#f5f5f5", padding: "0.5rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc" }}>Minuto</th>
              <th style={{ border: "1px solid #ccc" }}>N2S cola</th>
              <th style={{ border: "1px solid #ccc" }}>N2S circulando</th>
              <th style={{ border: "1px solid #ccc" }}>N2S salidas</th>
              <th style={{ border: "1px solid #ccc" }}>S2N cola</th>
              <th style={{ border: "1px solid #ccc" }}>S2N circulando</th>
              <th style={{ border: "1px solid #ccc" }}>S2N salidas</th>
            </tr>
          </thead>
          <tbody>
            {history_preview.slice(0,20).map((h,i) => (
              <tr key={i}>
                <td style={{ border: "1px solid #ccc", textAlign: "center" }}>{i}</td>
                <td style={{ border: "1px solid #ccc", textAlign: "center" }}>{h.N2S_queue}</td>
                <td style={{ border: "1px solid #ccc", textAlign: "center" }}>{h.N2S_active}</td>
                <td style={{ border: "1px solid #ccc", textAlign: "center" }}>{h.N2S_exited}</td>
                <td style={{ border: "1px solid #ccc", textAlign: "center" }}>{h.S2N_queue}</td>
                <td style={{ border: "1px solid #ccc", textAlign: "center" }}>{h.S2N_active}</td>
                <td style={{ border: "1px solid #ccc", textAlign: "center" }}>{h.S2N_exited}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {full_history_length > 20 && <p>... total registros: {full_history_length}</p>}
      </div>
    </div>
  );
}
