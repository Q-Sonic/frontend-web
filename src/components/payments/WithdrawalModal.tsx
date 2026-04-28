import React, { useState } from 'react';
import { api } from '../../api';
import { formatMoney } from '../../helpers/money';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  availableBalance 
}) => {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountType: 'Ahorros',
    holderName: '',
    holderDocument: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Monto inválido');
      setLoading(false);
      return;
    }

    if (numericAmount > availableBalance) {
      setError('Saldo insuficiente');
      setLoading(false);
      return;
    }

    try {
      await api('payments/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount: numericAmount,
          bankDetails
        })
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el retiro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Solicitar Retiro</h2>
            <button onClick={onClose} className="text-muted hover:text-white">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">Monto a retirar (Disponible: {formatMoney(availableBalance)})</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white outline-hidden focus:border-accent"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <input
                placeholder="Nombre del Banco"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white outline-hidden focus:border-accent"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
              />
              <div className="flex gap-4">
                <input
                  placeholder="Nº de Cuenta"
                  required
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2.5 text-white outline-hidden focus:border-accent"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                />
                <select
                  className="bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-white outline-hidden focus:border-accent appearance-none cursor-pointer"
                  value={bankDetails.accountType}
                  onChange={(e) => setBankDetails({...bankDetails, accountType: e.target.value})}
                >
                  <option value="Ahorros" className="bg-neutral-900 text-white">Ahorros</option>
                  <option value="Corriente" className="bg-neutral-900 text-white">Corriente</option>
                </select>
              </div>
              <input
                placeholder="Titular de la cuenta"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white outline-hidden focus:border-accent"
                value={bankDetails.holderName}
                onChange={(e) => setBankDetails({...bankDetails, holderName: e.target.value})}
              />
              <input
                placeholder="Documento/DNI del titular"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white outline-hidden focus:border-accent"
                value={bankDetails.holderDocument}
                onChange={(e) => setBankDetails({...bankDetails, holderDocument: e.target.value})}
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Confirmar Retiro'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
