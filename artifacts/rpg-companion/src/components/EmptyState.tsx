interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card-dark rounded-xl p-8 text-center animate-fadeIn">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-gray-300 mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
        {title}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-red px-4 py-2 rounded-lg text-sm font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
