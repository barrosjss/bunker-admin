"use client";

import { Card, Badge, Button } from "@/components/ui";
import { Membership } from "@/lib/types/database";
import { formatDate, daysUntilExpiration, isExpired } from "@/lib/utils/dates";
import { formatCurrency, getPaymentMethodLabel } from "@/lib/utils/formatting";
import { Calendar, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";

interface MembershipStatusProps {
  membership: (Membership & { membership_plans?: { name: string; duration_days?: number } | null }) | null;
  onRenew?: () => void;
  showRenewButton?: boolean;
}

export function MembershipStatus({ membership, onRenew, showRenewButton = true }: MembershipStatusProps) {
  if (!membership) {
    return (
      <Card className="border-warning/30 bg-warning/5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-warning/10">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">
              Sin membresía activa
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Este miembro no tiene una membresía activa. Registra un pago para
              activar su membresía.
            </p>
            {showRenewButton && onRenew && (
              <Button variant="primary" size="sm" onClick={onRenew}>
                Registrar pago
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const expired = isExpired(membership.end_date);
  const daysLeft = daysUntilExpiration(membership.end_date);
  const isExpiringSoon = !expired && daysLeft <= 7;

  const getStatusConfig = () => {
    if (expired) {
      return {
        icon: AlertTriangle,
        color: "danger",
        bgColor: "bg-danger/5",
        borderColor: "border-danger/30",
        iconBg: "bg-danger/10",
        badge: <Badge variant="danger">Vencida</Badge>,
        message: `Venció hace ${Math.abs(daysLeft)} días`,
      };
    }

    if (isExpiringSoon) {
      return {
        icon: AlertTriangle,
        color: "warning",
        bgColor: "bg-warning/5",
        borderColor: "border-warning/30",
        iconBg: "bg-warning/10",
        badge: <Badge variant="warning">Por vencer</Badge>,
        message:
          daysLeft === 0 ? "Vence hoy" : `Vence en ${daysLeft} días`,
      };
    }

    return {
      icon: CheckCircle,
      color: "success",
      bgColor: "bg-success/5",
      borderColor: "border-success/30",
      iconBg: "bg-success/10",
      badge: <Badge variant="success">Activa</Badge>,
      message: `${daysLeft} días restantes`,
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={`${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${config.iconBg}`}>
          <Icon className={`h-6 w-6 text-${config.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-text-primary">
              {membership.membership_plans?.name || "Membresía"}
            </h3>
            {config.badge}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(membership.start_date)} - {formatDate(membership.end_date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <CreditCard className="h-4 w-4" />
              <span>
                {formatCurrency(membership.amount_paid)} ({getPaymentMethodLabel(membership.payment_method || "cash")})
              </span>
            </div>
          </div>

          <p className={`text-sm mt-2 text-${config.color}`}>{config.message}</p>

          {(expired || isExpiringSoon) && showRenewButton && onRenew && (
            <Button
              variant="primary"
              size="sm"
              onClick={onRenew}
              className="mt-4"
            >
              Renovar membresía
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
