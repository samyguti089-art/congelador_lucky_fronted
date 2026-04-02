import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from "chart.js";
import axios from "axios";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

function VentasGrafico({ usuario, refreshTrigger }) {
  const [ventas, setVentas] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const res = await axios.get(`${API_URL}/ventas-dia`, {
          params: { cajero_id: usuario.id }
        });
        setVentas(res.data);
      } catch (err) {
        console.error("Error obteniendo ventas del día:", err);
      }
    };

    fetchVentas();
  }, [usuario, refreshTrigger]);

  const data = {
    labels: ventas.map(v => v.producto),
    datasets: [
      {
        data: ventas.map(v => v.unidades),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#9C27B0"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#9C27B0"]
      }
    ]
  };

  const totalUnidades = ventas.reduce((acc, v) => acc + v.unidades, 0);
  const totalDinero = ventas.reduce((acc, v) => acc + v.total, 0);

  // 🔹 Plugin para texto central
  const centerTextPlugin = {
    id: "centerText",
    beforeDraw: (chart) => {
      const { width, height } = chart;
      const ctx = chart.ctx;
      ctx.restore();

      // Texto Unidades
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "#FFD700"; // dorado brillante
      ctx.textBaseline = "middle";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 4;
      const texto1 = `Unidades: ${totalUnidades}`;
      const textX1 = Math.round((width - ctx.measureText(texto1).width) / 2);
      const textY1 = height / 2 - 15;
      ctx.fillText(texto1, textX1, textY1);

      // Texto Dinero
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#00FF7F"; // verde neón
      ctx.shadowColor = "black";
      ctx.shadowBlur = 4;
      const texto2 = `💰 $${totalDinero}`;
      const textX2 = Math.round((width - ctx.measureText(texto2).width) / 2);
      const textY2 = height / 2 + 15;
      ctx.fillText(texto2, textX2, textY2);

      ctx.save();
    }
  };

  return (
    <div className="ventas-grafico">
      <h3 style={{
        fontFamily: "Arial, sans-serif",
        color: "#FFD700",
        textShadow: "2px 2px 4px #000"
      }}>
        📊 Ventas del día
      </h3>

      {ventas.length === 0 ? (
        <p style={{ color: "#fff", fontWeight: "bold" }}>No hay ventas registradas hoy</p>
      ) : (
        <Doughnut data={data} plugins={[centerTextPlugin]} />
      )}
    </div>
  );
}

export default VentasGrafico;

