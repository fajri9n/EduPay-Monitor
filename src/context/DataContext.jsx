import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { notificationService } from '../services/notificationService';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgetData, setBudgetData] = useState({ allocations: [], expenditures: [] });
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);

  // Filter global dashboard
  const [filterClass, setFilterClass] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');

  // Load all initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [billsData, txData, bgtData, notifData, summaryData] = await Promise.all([
        apiService.getBills(),
        apiService.getTransactions(),
        apiService.getBudgetData(),
        apiService.getNotificationLogs(),
        apiService.getDashboardSummary(filterClass, filterPeriod),
      ]);

      setBills(billsData);
      setTransactions(txData);
      setBudgetData(bgtData);
      setNotificationLogs(notifData);
      setDashboardSummary(summaryData);
    } catch (err) {
      console.error('Gagal memuat data sistem:', err);
    } finally {
      setLoading(false);
    }
  }, [filterClass, filterPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const verifyTransaction = async (transactionId, userId) => {
    await apiService.verifyTransaction(transactionId, userId);
    await fetchData(); // Refresh state secara menyeluruh (dashboard, bills, transactions sinkron)
  };

  const rejectTransaction = async (transactionId, reason) => {
    await apiService.rejectTransaction(transactionId, reason);
    await fetchData();
  };

  const recordTransaction = async (payload) => {
    const res = await apiService.createTransaction(payload);
    await fetchData();
    return res;
  };

  const sendNotification = async (billId, channel, customMessage) => {
    const res = await notificationService.sendSingle(billId, channel, customMessage);
    const updatedLogs = await apiService.getNotificationLogs();
    setNotificationLogs(updatedLogs);
    return res;
  };

  const sendBulkNotifications = async (billIds, channel) => {
    const res = await notificationService.sendBulk(billIds, channel);
    const updatedLogs = await apiService.getNotificationLogs();
    setNotificationLogs(updatedLogs);
    return res;
  };

  const addExpenditure = async (payload) => {
    const res = await apiService.addExpenditure(payload);
    const updatedBgt = await apiService.getBudgetData();
    setBudgetData(updatedBgt);
    return res;
  };

  // Hitung jumlah overdue real-time untuk badge sidebar & topbar
  const overdueCount = bills.filter((b) => b.payment_status === 'Overdue' && b.amount_due > 0).length;

  return (
    <DataContext.Provider
      value={{
        loading,
        bills,
        transactions,
        budgetData,
        notificationLogs,
        dashboardSummary,
        filterClass,
        setFilterClass,
        filterPeriod,
        setFilterPeriod,
        overdueCount,
        refreshData: fetchData,
        verifyTransaction,
        rejectTransaction,
        recordTransaction,
        sendNotification,
        sendBulkNotifications,
        addExpenditure,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

