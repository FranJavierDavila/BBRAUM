import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Los modelos GLB (~12 MB), el decodificador DRACO y los ficheros subidos se
  // cachean de forma durable: sus URLs son únicas (nombre con marca de tiempo y
  // hash) o versionados con el repositorio, así que el navegador solo los
  // descarga una vez y las siguientes aperturas son inmediatas (v1.4.7).
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/draco/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
