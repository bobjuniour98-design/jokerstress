export const formatNumber = (num: number = 0): string => {
    return num.toLocaleString('en-US');
  };
  
  export const formatCurrency = (num: number = 0): string => {
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };
  