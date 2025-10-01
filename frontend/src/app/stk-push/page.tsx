import StkPushForm from '@/components/stk-push-form';

export default function StkPushPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">M-Pesa STK Push</h1>
      <div className="max-w-md">
        <h2 className="text-xl font-semibold mb-2">Initiate STK Push</h2>
        <p className="text-gray-600 mb-4">
          Enter the customer's details below to send a payment prompt to their phone.
        </p>
        <StkPushForm />
      </div>
    </div>
  );
}
