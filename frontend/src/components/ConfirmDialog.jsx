import { AlertTriangle, HelpCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <div className={`confirm-dialog__icon ${variant !== 'danger' ? 'confirm-dialog__icon--neutral' : ''}`}>
        {variant === 'danger' ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}
      </div>
      <p className="confirm-dialog__message">{message}</p>
    </Modal>
  );
}
