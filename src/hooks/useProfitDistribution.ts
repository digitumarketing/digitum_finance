import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';

interface ProfitDistribution {
  companyPercentage: number;
  roshaanPercentage: number;
  shahbazPercentage: number;
}

export const useProfitDistribution = (selectedMonth: string): ProfitDistribution => {
  const { user } = useSupabaseAuth();
  const [distribution, setDistribution] = useState<ProfitDistribution>({
    companyPercentage: 50,
    roshaanPercentage: 25,
    shahbazPercentage: 25
  });

  useEffect(() => {
    const fetchDistribution = async () => {
      if (!user || !selectedMonth) {
        setDistribution({
          companyPercentage: 50,
          roshaanPercentage: 25,
          shahbazPercentage: 25
        });
        return;
      }

      const [year, month] = selectedMonth.split('-').map(Number);

      try {
        const { data, error } = await supabase
          .from('profit_distribution_settings')
          .select('company_percentage, roshaan_percentage, shahbaz_percentage')
          .eq('user_id', user.id)
          .eq('year', year)
          .eq('month', month)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profit distribution:', error);
          return;
        }

        if (data) {
          setDistribution({
            companyPercentage: Number(data.company_percentage),
            roshaanPercentage: Number(data.roshaan_percentage),
            shahbazPercentage: Number(data.shahbaz_percentage)
          });
        } else {
          setDistribution({
            companyPercentage: 50,
            roshaanPercentage: 25,
            shahbazPercentage: 25
          });
        }
      } catch (err) {
        console.error('Error fetching profit distribution:', err);
        setDistribution({
          companyPercentage: 50,
          roshaanPercentage: 25,
          shahbazPercentage: 25
        });
      }
    };

    fetchDistribution();
  }, [user, selectedMonth]);

  return distribution;
};
