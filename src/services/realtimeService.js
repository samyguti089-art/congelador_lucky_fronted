import { supabase } from './supabaseClient';

export const subscribeToSales = (callback) => {
  const subscription = supabase
    .channel('ventas_cabecera_changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ventas_cabecera' }, (payload) => {
      callback(payload.new);
    })
    .subscribe();

  return () => subscription.unsubscribe();
};
