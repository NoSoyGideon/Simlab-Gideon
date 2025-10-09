import React, { useState, useEffect, useRef } from "react";

// Helper para formatear fecha
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

// Horarios pico
const horasPico = {
  NS_lv: [[6, 9], [11.5, 13], [17, 19.5]],
  SN_lv: [[6, 9], [11.5, 13], [17, 21.25]],
  NS_sd: [[6, 20], [13, 15]],
  SN_sd: [[7, 9.5], [4.5, 22]],
};

// Función para determinar si es hora pico
function esHoraPico(fecha, sentido) {
  const dia = new Date(fecha).getDay(); // 0=Domingo, 1=Lunes
  const horaDecimal =
    new Date(fecha).getHours() + new Date(fecha).getMinutes() / 60;

  if (dia >= 1 && dia <= 5) {
    if (sentido === "NS") return horasPico.NS_lv.some(([ini, fin]) => horaDecimal >= ini && horaDecimal <= fin);
    if (sentido === "SN") return horasPico.SN_lv.some(([ini, fin]) => horaDecimal >= ini && horaDecimal <= fin);
  } else {
    if (sentido === "NS") return horasPico.NS_sd.some(([ini, fin]) => horaDecimal >= ini && horaDecimal <= fin);
    if (sentido === "SN") return horasPico.SN_sd.some(([ini, fin]) => horaDecimal >= ini && horaDecimal <= fin);
  }
  return false;
}

function App() {
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [simulando, setSimulando] = useState(false);
  const [data, setData] = useState([]);
  const [index, setIndex] = useState(0);
  const intervalRef = useRef(null);

  const [viaNS, setViaNS] = useState({ num: 0, progreso: 0 });
  const [viaSN, setViaSN] = useState({ num: 0, progreso: 0 });
  const [viaDin, setViaDin] = useState({ num: 0, progreso: 0, sentido: -1 });
  const [fechaActual, setFechaActual] = useState("");
  const [velocidad, setVelocidad] = useState(1000); // 1000ms = 1 minuto de simulación
  const MAX_CARROS = 125;

  const iniciarSimulacion = async () => {

    if (!inicio || !fin) return alert("Por favor ingresa fechas válidas");
    // Validar que la fecha/hora de fin no sea menor que la de inicio
    if (new Date(fin) < new Date(inicio)) {
      alert("La fecha y hora de fin no puede ser menor que la de inicio");
      return;
    }

    if (!simulando) {
      setSimulando(true);
      setIndex(0);

      try {
        const API_HOST = "http://localhost:8000";
        const res = await fetch(
          `${API_HOST}/api/simulacion_carros/?inicio=${inicio}&fin=${fin}`
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setSimulando(false);
      }
    } else {
      // Cancelar simulación
      clearInterval(intervalRef.current);
      setSimulando(false);
      setIndex(0);
      setData([]);
      setViaNS({ num: 0, progreso: 0 });
      setViaSN({ num: 0, progreso: 0 });
      setViaDin({ num: 0, progreso: 0, sentido: -1 });
      setFechaActual("");
    }
  };

  useEffect(() => {
    if (simulando && data.length > 0) {
      intervalRef.current = setInterval(() => {
        setIndex((prev) => {
          if (prev >= data.length) {
            clearInterval(intervalRef.current);
            setSimulando(false);
            return prev;
          }
          const row = data[prev];

          setViaNS({
            num: row.num_carros_1,
            progreso: Math.min((row.num_carros_1 / MAX_CARROS) * 100, 100),
          });
          setViaSN({
            num: row.num_carros_0,
            progreso: Math.min((row.num_carros_0 / MAX_CARROS) * 100, 100),
          });
          setViaDin({
            num: row.num_carros_3,
            progreso: Math.min((row.num_carros_3 / MAX_CARROS) * 100, 100),
            sentido: row.sentido_3,
          });
          setFechaActual(row.fecha_entrada);
          return prev + 1;
        });
      }, velocidad);

      return () => clearInterval(intervalRef.current);
    }
  }, [simulando, data, velocidad]);

  // Estilos
  const menuStyle = {
    position: "absolute",
    top: 20,
    left: 20,
    padding: "20px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6BC1FF, #8C64FF)",
    color: "white",
    border: "2px solid white",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    width: "250px",
  };

  const buttonStyle = {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #FF9CEE, #6BC1FF)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  };

  const viaStyle = (gradiente) => ({
    flex: 1,
    margin: "0 10px",
    padding: "20px",
    borderRadius: "12px",
    background: gradiente,
    color: "white",
    textAlign: "center",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  });

  const barraProgresoStyle = {
    height: "20px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.3)",
    marginTop: "10px",
    position: "relative",
  };

  const progresoInteriorStyle = (num) => {
    let porcentaje = Math.min((num / MAX_CARROS) * 100, 100);
    let color = "green";
    if (porcentaje > 80) color = "red";
    else if (porcentaje > 50) color = "yellow";
    return {
      width: `${porcentaje}%`,
      height: "100%",
      borderRadius: "10px",
      background: color,
      transition: "width 0.3s, background 0.3s",
    };
  };

  const sentidoTexto = (s) => {
    if (s === -1) return "CERRADA";
    if (s === 1) return "NORTE-SUR";
    if (s === 0) return "SUR-NORTE";
    return "-";
  };

  return (
    <div style={{
      background: "#fff",
      minHeight: "100vh",
      padding: "20px",
      paddingTop: "150px" // <-- baja todo menos el menú
    }}>
      {/* Menu flotante */}
      <div style={menuStyle}>
        <div>
          <label>Fecha y hora inicio:</label>
          <input
            type="datetime-local"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            style={{ width: "100%", marginTop: "5px", borderRadius: "6px" }}
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>Fecha y hora fin:</label>
          <input
            type="datetime-local"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            style={{ width: "100%", marginTop: "5px", borderRadius: "6px" }}
          />
        </div>
        <button style={buttonStyle} onClick={iniciarSimulacion}>
          {simulando ? "Cancelar Simulación" : "Iniciar Simulación"}
        </button>

        {/* Slider velocidad */}
        <div style={{ marginTop: "15px" }}>
          <label>Velocidad de simulación: {((1000 / velocidad).toFixed(1))}x</label>
          <input
            type="range"
            min="50"
            max="2000"
            step="50"
            value={velocidad}
            onChange={(e) => setVelocidad(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Fecha central */}
      <div style={{ textAlign: "center", marginTop: "100px", fontSize: "24px" }}>
        {fechaActual ? formatDate(fechaActual) : "Simulación detenida"}
      </div>

      {/* Vías */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
        {/* Sur-Norte */}
        <div style={viaStyle("linear-gradient(135deg, #FF6B6B, #FFD93D)")}>
          <h3>VIA SUR-NORTE</h3>
          {esHoraPico(fechaActual, "SN") && (
            <div style={{ color: "yellow", fontWeight: "bold" }}>HORA PICO!</div>
          )}
          <div style={{ fontSize: "36px", fontWeight: "bold" }}>{viaSN.num}</div>
          <div style={barraProgresoStyle}>
            <div style={progresoInteriorStyle(viaSN.num)} />
          </div>
        </div>

        {/* Dinámica */}
        <div style={viaStyle("linear-gradient(135deg, #6BC1FF, #8C64FF)")}>
          <h3>VIA DINAMICA</h3>
          <div>{sentidoTexto(viaDin.sentido)}</div>
          <div style={{ fontSize: "36px", fontWeight: "bold" }}>{viaDin.num}</div>
          <div style={barraProgresoStyle}>
            <div style={progresoInteriorStyle(viaDin.num)} />
          </div>
        </div>

        {/* Norte-Sur */}
        <div style={viaStyle("linear-gradient(135deg, #FF9CEE, #6BC1FF)")}>
          <h3>VIA NORTE-SUR</h3>
          {esHoraPico(fechaActual, "NS") && (
            <div style={{ color: "yellow", fontWeight: "bold" }}>HORA PICO!</div>
          )}
          <div style={{ fontSize: "36px", fontWeight: "bold" }}>{viaNS.num}</div>
          <div style={barraProgresoStyle}>
            <div style={progresoInteriorStyle(viaNS.num)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
