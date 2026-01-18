export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPhone(phone: string): string {
  // Format Mexican phone numbers (10 digits)
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function classNames(...classes: unknown[]): string {
  return classes.filter((c): c is string => typeof c === "string" && Boolean(c)).join(" ");
}

export const cn = classNames;

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function getMemberStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    suspended: "Suspendido",
  };
  return labels[status] || status;
}

export function getMembershipStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Activa",
    expired: "Vencida",
    cancelled: "Cancelada",
  };
  return labels[status] || status;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
  };
  return labels[method] || method;
}

export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  };
  return labels[difficulty] || difficulty;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "Administrador",
    trainer: "Entrenador",
  };
  return labels[role] || role;
}
