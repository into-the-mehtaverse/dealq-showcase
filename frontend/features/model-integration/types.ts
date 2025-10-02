export interface Model {
  id: string;
  name: string;
  description?: string;
  type: 'custom' | 'template';
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
  fileUrl?: string;
  mappingConfig?: MappingConfig;
}

export interface MappingConfig {
  sheets: SheetMapping[];
  validationRules: ValidationRule[];
  outputFormat: OutputFormat;
}

export interface SheetMapping {
  sheetName: string;
  mappings: FieldMapping[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface OutputFormat {
  format: 'excel' | 'csv' | 'json';
  template: string;
}

export type ModelType = 'custom' | 'template';
export type ModelStatus = 'active' | 'inactive' | 'pending';
