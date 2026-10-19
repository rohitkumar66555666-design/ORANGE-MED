// Empty-state message for lists with no items.

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && <Icon className="w-10 h-10 text-slate-300 mb-3" />}
      <p className="font-bold text-slate-800">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
