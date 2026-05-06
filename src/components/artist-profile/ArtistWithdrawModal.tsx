import React, { useState } from 'react';
import { FiX, FiArrowLeft } from 'react-icons/fi';
import { Button } from '../Button';
import { Input } from '../Input';
import { formatMoney } from '../../helpers/money';
import { paymentService } from '../../api/paymentService';

interface ArtistWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onWithdrawSuccess: () => void;
}

export function ArtistWithdrawModal({ isOpen, onClose, balance, onWithdrawSuccess }: ArtistWithdrawModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [bankName, setBankName] = useState('Banco Pichincha');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('Ahorros');
  const [holderName, setHolderName] = useState('');
  const [holderDocument, setHolderDocument] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Calculos segun referencia del usuario
  const withdrawalFee = 5.00;
  const numAmount = parseFloat(amount) || 0;
  const totalAvailable = Math.max(0, balance - withdrawalFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (numAmount <= 0) {
      setError('Por favor, ingresa un monto válido.');
      return;
    }

    if (numAmount > totalAvailable) {
      setError(`No puedes retirar más de lo disponible ($${totalAvailable.toFixed(2)}).`);
      return;
    }

    if (!bankName || !accountNumber || !holderName || !holderDocument) {
      setError('Por favor, completa todos los datos bancarios.');
      return;
    }

    setLoading(true);
    try {
      await paymentService.withdraw(numAmount, {
        bankName,
        accountNumber,
        accountType,
        holderName,
        holderDocument
      });
      onWithdrawSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el retiro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111214] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <FiArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-white">Retiro de dinero</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <p className="text-sm text-white/60 -mt-2">Transfiere tus ganancias a tu cuenta bancaria</p>

          {/* Saldo Actual Card */}
          <div className="bg-white/5 border border-[#00d4c8]/30 rounded-2xl p-6 text-center shadow-[0_0_20px_rgba(0,212,200,0.05)]">
            <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Saldo actual</p>
            <p className="text-3xl font-bold text-white">
              ${formatMoney(balance)} <span className="text-sm font-normal opacity-50">USD</span>
            </p>
          </div>

          {/* Input Monto */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white px-1">Monto a retirar</label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">$</span>
                <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-8 pr-4 text-white text-lg focus:border-[#00d4c8]/50 outline-hidden transition"
                />
            </div>
            <p className="text-xs text-white/40 px-1">
                Costo del retiro: ${formatMoney(withdrawalFee)} USD por transacción<br />
                Tienes <span className="text-white/70 font-medium">${formatMoney(totalAvailable)}</span> disponibles para retirar
            </p>
          </div>

          {/* Datos Bancarios */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white px-1">Transferir a</h3>
            <div className="grid grid-cols-1 gap-3">
                <Input 
                    placeholder="Nombre del Banco" 
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)} 
                />
                <Input 
                    placeholder="Número de Cuenta" 
                    value={accountNumber} 
                    onChange={(e) => setAccountNumber(e.target.value)} 
                />
                <div className="grid grid-cols-2 gap-3">
                    <select 
                        value={accountType} 
                        onChange={(e) => setAccountType(e.target.value)}
                        className="bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00d4c8]/50 outline-hidden"
                    >
                        <option value="Ahorros">Ahorros</option>
                        <option value="Corriente">Corriente</option>
                    </select>
                    <Input 
                        placeholder="Cédula/RUC" 
                        value={holderDocument} 
                        onChange={(e) => setHolderDocument(e.target.value)} 
                    />
                </div>
                <Input 
                    placeholder="Nombre del Titular" 
                    value={holderName} 
                    onChange={(e) => setHolderName(e.target.value)} 
                />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-xl animate-shake">
              {error}
            </p>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
                variant="ghost" 
                type="button" 
                onClick={onClose} 
                className="flex-1 bg-white/5 hover:bg-white/10"
            >
                Cancelar
            </Button>
            <Button 
                variant="primary" 
                type="submit" 
                loading={loading}
                className="flex-1 shadow-[0_0_20px_rgba(0,212,200,0.3)]"
            >
                {loading ? 'Procesando...' : 'Retirar ahora'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
