import React from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { Button } from '../../components';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const orderId = searchParams.get('order_id');
  const transactionId = searchParams.get('id');

  const isSuccess = location.pathname.includes('/success');
  const isFailure = location.pathname.includes('/failure');
  const isPending = location.pathname.includes('/pending') || location.pathname.includes('/review');

  let title = 'Procesando Pago';
  let message = 'Estamos verificando el estado de tu transacción.';
  let icon = <FiClock className="text-yellow-500 w-16 h-16" />;
  let bgColor = 'bg-yellow-50';

  if (isSuccess) {
    title = '¡Pago Exitoso!';
    message = 'Tu pago ha sido procesado correctamente. ¡Gracias por tu compra!';
    icon = <FiCheckCircle className="text-green-500 w-16 h-16" />;
    bgColor = 'bg-green-50';
  } else if (isFailure) {
    title = 'Pago Fallido';
    message = 'Hubo un problema al procesar tu pago. Por favor, intenta de nuevo.';
    icon = <FiXCircle className="text-red-500 w-16 h-16" />;
    bgColor = 'bg-red-50';
  } else if (isPending) {
    title = 'Pago en Revisión';
    message = 'Tu pago está siendo procesado por la entidad bancaria. Te notificaremos pronto.';
    icon = <FiClock className="text-blue-500 w-16 h-16" />;
    bgColor = 'bg-blue-50';
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className={`max-w-md w-full p-8 rounded-2xl shadow-xl bg-white text-center`}>
        <div className={`inline-flex items-center justify-center p-4 rounded-full mb-6 ${bgColor}`}>
          {icon}
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-8">{message}</p>

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left border border-gray-200">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Referencia del Pedido</p>
            <p className="font-mono text-gray-900">{orderId}</p>
            {transactionId && (
              <>
                <p className="text-sm text-gray-500 uppercase tracking-wider mt-3 mb-1">ID de Transacción</p>
                <p className="font-mono text-gray-900">{transactionId}</p>
              </>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Link to="/client/contracts">
            <Button className="w-full" variant="primary">
              Volver a Mis Contratos
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button className="w-full" variant="ghost">
              Ir al Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
