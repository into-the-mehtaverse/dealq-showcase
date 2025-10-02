"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_GROUPS, getCategoryInfo, ALL_CATEGORIES } from "../t-12-service";
import { useVerificationSelectors } from "@/features/verification/store";

interface CategoryViewProps {
  data: Array<Record<string, any>>;
  onDataChange: (newData: Array<Record<string, any>>) => void;
}

interface Subgroup {
  name: string;
  icon: string;
  color: string;
  items: Array<Record<string, any>>;
  total: number;
}

interface RestructuredGroup {
  name: string;
  icon: string;
  color: string;
  items: Array<Record<string, any>>;
  total: number;
  subgroups: Subgroup[];
}

export default function CategoryView({ data, onDataChange }: CategoryViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<{ item: Record<string, any>; field: 'category' | 'total' } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Get computed financials from store instead of calculating locally
  const totalRevenue = useVerificationSelectors.useTotalRevenue();
  const totalDeductions = useVerificationSelectors.useTotalDeductions();
  const totalExpenses = useVerificationSelectors.useTotalExpenses();
  const grossIncome = useVerificationSelectors.useGrossIncome();
  const noi = useVerificationSelectors.useNOI();

  // Group data by main categories (Revenue, Deductions, Expenses)
  const groupedData = CATEGORY_GROUPS.map(group => {
    const items = data.filter(item =>
      Object.keys(group.categories).includes(item.category)
    );

    // Group items within each main category by their individual categories
    const categorySubgroups: Record<string, Subgroup> = {};
    items.forEach(item => {
      const categoryInfo = getCategoryInfo(item.category);
      if (!categorySubgroups[item.category]) {
        categorySubgroups[item.category] = {
          name: categoryInfo.label,
          icon: categoryInfo.icon,
          color: categoryInfo.color,
          items: [],
          total: 0
        };
      }
      categorySubgroups[item.category].items.push(item);
      categorySubgroups[item.category].total += item.total;
    });

    return {
      ...group,
      items,
      total: items.reduce((sum, item) => sum + item.total, 0),
      subgroups: Object.values(categorySubgroups) as Subgroup[]
    };
  });

  // Create a new structure with deductions under revenue
  const restructuredData: RestructuredGroup[] = [];

  // Add Revenue + Deductions as "Total Income"
  const revenueGroup = groupedData.find(g => g.name === 'Revenues');
  const deductionsGroup = groupedData.find(g => g.name === 'Deductions');

  if (revenueGroup || deductionsGroup) {
    const totalIncomeItems = [...(revenueGroup?.items || []), ...(deductionsGroup?.items || [])];
    const totalIncomeSubgroups = [];

    // Add revenue subgroups
    if (revenueGroup) {
      totalIncomeSubgroups.push(...revenueGroup.subgroups);
    }

    // Add deductions subgroups with red styling
    if (deductionsGroup) {
      const redDeductionsSubgroups = deductionsGroup.subgroups.map(subgroup => ({
        ...subgroup,
        color: 'bg-red-100 text-red-800 border-red-200',
        items: subgroup.items
      }));
      totalIncomeSubgroups.push(...redDeductionsSubgroups);
    }

    restructuredData.push({
      name: 'Total Income',
      icon: '💰',
      color: 'bg-green-50 border-green-200 text-green-800',
      items: totalIncomeItems,
      total: grossIncome,
      subgroups: totalIncomeSubgroups
    });
  }

  // Add Total Expenses
  const expensesGroup = groupedData.find(g => g.name === 'Expenses');
  if (expensesGroup) {
    restructuredData.push({
      name: 'Total Expenses',
      icon: '💸',
      color: expensesGroup.color,
      items: expensesGroup.items,
      total: totalExpenses,
      subgroups: expensesGroup.subgroups
    });
  }

  // Add Subtotals section
  const subtotalsGroup = groupedData.find(g => g.name === 'Subtotals');
  if (subtotalsGroup && subtotalsGroup.items.length > 0) {
    restructuredData.push({
      name: 'Subtotals',
      icon: '📊',
      color: 'border-gray-200 bg-gray-50 text-gray-700',
      items: subtotalsGroup.items,
      total: subtotalsGroup.total,
      subgroups: subtotalsGroup.subgroups
    });
  }

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleSubgroup = (subgroupName: string) => {
    const newExpanded = new Set(expandedSubgroups);
    if (newExpanded.has(subgroupName)) {
      newExpanded.delete(subgroupName);
    } else {
      newExpanded.add(subgroupName);
    }
    setExpandedSubgroups(newExpanded);
  };

  const startEditing = (item: Record<string, any>, field: 'category' | 'total', currentValue: string | number) => {
    setEditingItem({ item, field });
    setEditValue(String(currentValue));
  };

  const saveEdit = () => {
    if (!editingItem) return;

    const newData = [...data];
    const itemIndex = newData.findIndex(item => item === editingItem.item);

    if (itemIndex === -1) {
      return;
    }

    const item = newData[itemIndex];

    if (editingItem.field === 'category') {
      const newCategory = editValue;
      const oldCategory = item.category;

      // Check if the category is changing to/from a deduction
      const isNewCategoryDeduction = Object.keys(CATEGORY_GROUPS.find(g => g.name === 'Deductions')?.categories || {}).includes(newCategory);
      const isOldCategoryDeduction = Object.keys(CATEGORY_GROUPS.find(g => g.name === 'Deductions')?.categories || {}).includes(oldCategory);

      // Update the category
      item.category = newCategory;

      // Don't force sign changes - let users maintain the values they want

    } else if (editingItem.field === 'total') {
      const numValue = parseFloat(editValue) || 0;
      // Allow users to enter any sign they want - don't force it based on category
      item.total = numValue;
    }

    onDataChange(newData);
    setEditingItem(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValue("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {restructuredData.map((group) => (
        <Card key={group.name} className={`${group.color}`}>
          <button
            onClick={() => toggleGroup(group.name)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-opacity-75 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {expandedGroups.has(group.name) ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <span className="font-semibold text-lg">{group.name}</span>
              <Badge variant="secondary" className="text-xs">
                {group.items.length} items
              </Badge>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatCurrency(group.total)}</div>
            </div>
          </button>

          {expandedGroups.has(group.name) && (
            <CardContent className="border-t bg-white p-0">
              {group.subgroups.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-center">
                  No items in this category
                </div>
              ) : (
                <div className="divide-y">
                  {group.subgroups.map((subgroup: Subgroup) => {
                    // Check if this subgroup contains deduction categories
                    const deductionGroup = CATEGORY_GROUPS.find(g => g.name === 'Deductions');
                    const isDeductionSubgroup = subgroup.items.some(item =>
                      deductionGroup && Object.keys(deductionGroup.categories).includes(item.category)
                    );

                    return (
                      <div key={subgroup.name} className="px-4 py-3">
                        <button
                          onClick={() => toggleSubgroup(subgroup.name)}
                          className={`w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded px-2 py-1 ${
                            isDeductionSubgroup ? 'bg-red-50 hover:bg-red-100' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {expandedSubgroups.has(subgroup.name) ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-sm">{subgroup.icon}</span>
                            <span className={`font-medium ${
                              isDeductionSubgroup ? 'text-red-800' : 'text-gray-900'
                            }`}>
                              {subgroup.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {subgroup.items.length} items
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${
                              isDeductionSubgroup ? 'text-red-800' : 'text-gray-900'
                            }`}>
                              {formatCurrency(subgroup.total)}
                            </div>
                          </div>
                        </button>

                      {expandedSubgroups.has(subgroup.name) && (
                        <div className="ml-6 space-y-2 mt-2">
                          {subgroup.items.map((item, index) => {
                            const globalIndex = data.findIndex(d => d === item);
                            const categoryInfo = getCategoryInfo(item.category);
                            const isEditing = editingItem?.item === item;

                            return (
                              <Card key={`${item.line_item}-${index}`} className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 mb-1">
                                      {item.line_item}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      {isEditing && editingItem?.field === 'category' ? (
                                        <div className="flex items-center space-x-1">
                                          <Select value={editValue} onValueChange={setEditValue}>
                                            <SelectTrigger className="w-48">
                                              <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {Object.keys(ALL_CATEGORIES).map(cat => (
                                                <SelectItem key={cat} value={cat}>
                                                  {getCategoryInfo(cat).label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <Button
                                            onClick={saveEdit}
                                            size="sm"
                                            variant="ghost"
                                            className="text-green-600 hover:text-green-800"
                                          >
                                            <Check className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            onClick={cancelEdit}
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Badge
                                          className={`${categoryInfo.color} cursor-pointer hover:opacity-80`}
                                          onClick={() => startEditing(item, 'category', item.category)}
                                        >
                                          <span className="mr-1">{categoryInfo.icon}</span>
                                          {categoryInfo.label}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2 ml-4">
                                    {isEditing && editingItem?.field === 'total' ? (
                                      <div className="flex items-center space-x-1">
                                        <Input
                                          type="number"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="w-32"
                                          placeholder="Amount"
                                          autoFocus
                                        />
                                        <Button
                                          onClick={saveEdit}
                                          size="sm"
                                          variant="ghost"
                                          className="text-green-600 hover:text-green-800"
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          onClick={cancelEdit}
                                          size="sm"
                                          variant="ghost"
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div
                                        className="text-right cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                                        onClick={() => startEditing(item, 'total', item.total)}
                                      >
                                        <div className={`font-semibold ${
                                          isDeductionSubgroup ? 'text-red-800' : 'text-gray-900'
                                        }`}>
                                          {formatCurrency(item.total)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {/* NOI Summary */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Net Operating Income (NOI)</h3>
                <p className="text-sm text-gray-600">
                  Revenue + Deductions - Expenses
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${noi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(noi)}
              </div>
              <div className="text-sm text-gray-500">
                {noi >= 0 ? 'Positive NOI' : 'Negative NOI'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
