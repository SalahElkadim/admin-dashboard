import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import arEG from "antd/locale/ar_EG";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ConfigProvider
      locale={arEG}
      direction="rtl"
      theme={{
        token: {
          colorPrimary: "#6366F1",
          borderRadius: 8,
          fontFamily: "'Cairo', sans-serif",
        },
        components: {
          Menu: {
            darkItemBg: "transparent",
            darkItemSelectedBg: "rgba(99,102,241,0.15)",
            darkItemSelectedColor: "#818CF8",
            darkItemColor: "#94A3B8",
            darkItemHoverColor: "#fff",
            itemMarginInline: 6,
            itemBorderRadius: 10,
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
