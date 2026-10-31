"use client";

// Last resort if the whole site layout fails. It replaces the root layout, so
// it can't use the site's stylesheet or fonts — styles are inline.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          background: "#0d2219",
          color: "#f3efe6",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <title>Muj &amp; Areen</title>
        <h1 style={{ fontWeight: 400, fontSize: 36, margin: 0 }}>Something went wrong</h1>
        <p style={{ margin: 0, opacity: 0.75 }}>Please try again in a moment.</p>
        <p dir="rtl" style={{ margin: "16px 0 0", fontSize: 26 }}>
          حدث خطأ ما
        </p>
        <p dir="rtl" style={{ margin: 0, opacity: 0.75 }}>
          يُرجى المحاولة بعد قليل.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            marginTop: 24,
            padding: "12px 28px",
            border: 0,
            background: "#b8923f",
            color: "#0d2219",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again · حاول مجدداً
        </button>
      </body>
    </html>
  );
}
