import type {NextConfig} from 'next';
// Dev only: extra hostnames (e.g. a LAN IP for testing on a phone) that may load /_next dev resources.
// ALLOWED_DEV_ORIGINS=192.168.43.220,my-pc.local npm run dev   (comma-separated, no scheme/port). Unused by next build.
const allowedDevOrigins=(process.env.ALLOWED_DEV_ORIGINS??'').split(',').map(s=>s.trim()).filter(Boolean);
const config:NextConfig={output:'export',trailingSlash:true,images:{unoptimized:true},poweredByHeader:false,...(allowedDevOrigins.length?{allowedDevOrigins}:{})};
export default config;
