export default function Loader({ label = 'Loading...', full = false }) {
  return (
    <div className={full ? 'loader-full' : 'loader-wrap'}>
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
