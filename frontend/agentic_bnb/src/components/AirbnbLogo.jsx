const LOGO_URL = 'https://img.icons8.com/color/1200/airbnb.jpg'

export default function AirbnbLogo({ size = 28 }) {
  return (
    <img
      src={LOGO_URL}
      alt="Airbnb"
      width={size}
      height={size}
      className="airbnb-logo"
      decoding="async"
    />
  )
}
