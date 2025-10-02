"""
Rent roll classification prompt templates for LLM-based boundary analysis.

Separated from business logic for easier maintenance and prompt iteration.
"""

from langchain.prompts import PromptTemplate


def get_file_type_data_structure(file_type: str) -> str:
    """Get the appropriate data structure description based on file type."""
    if file_type.lower() == "pdf":
        return """{
  "data_start_page": integer,
  "data_end_page": integer,
  "data_start_marker": string|null,
  "data_end_marker": string|null,
  "exclude_patterns": [string],
  "estimated_units": integer|null,
  "confidence": "high"|"medium"|"low",
  "column_headers": [string]
}"""
    elif file_type.lower() == "excel":
        return """{
  "data_sheet_name": string,
  "data_start_row": integer,
  "data_end_row": integer,
  "data_start_column": string|null,
  "data_end_column": string|null,
  "exclude_patterns": [string],
  "estimated_units": integer|null,
  "confidence": "high"|"medium"|"low",
  "column_headers": [string]
}"""
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def get_file_type_example_output(file_type: str) -> str:
    """Get the appropriate example output based on file type."""
    if file_type.lower() == "pdf":
        return """{
  "data_start_page": 1,
  "data_end_page": 3,
  "data_start_marker": "Occupied RENT 0.00 26,000.00 0.00 26,000.00 RESIDENT 26,000.00 11/14/2022 Brewing, Ministry 20000 CS-1 N/A CS 7,670.00 12/01/2023 11/30/2026",
  "data_end_marker": "Occupied PETRENT 2,595.00 2,345.00 50.00 0.00 RESIDENT 2,295.00 12/14/2022 Huebner, Chrisine 3202 MLD-306 N/A 2x2 1120 0.00 01/01/2020 12/31/2020",
  "exclude_patterns": [
    "Unit Mix Summary",
    "Total Units",
    "Total Rent",
    "totals:",
    "sub journal summary",
    "code summary"
  ],
  "estimated_units": 38,
  "confidence": "high",
  "column_headers": ["Status", "Type", "Base Rent", "Market Rent", "Concessions", "Net Rent", "Unit Type", "Rent", "Date", "Tenant", "Size", "Unit", "Notes", "Unit Type", "Size", "Rent", "Start Date", "End Date"]
}"""
    elif file_type.lower() == "excel":
        return """{
  "data_sheet_name": "Report1",
  "data_start_row": 9,
  "data_end_row": 999,
  "data_start_column": "A",
  "data_end_column": "L",
  "exclude_patterns": [
    "Unit Mix Summary",
    "Total Units",
    "Total Rent",
    "Summary Groups",
    "Current/Notice/Vacant Residents",
    "Future Residents/Applicants",
    "Totals:"
  ],
  "estimated_units": 990,
  "confidence": "high",
  "column_headers": ["Unit", "Type", "Status", "Size (SF)", "Rent", "Lease Expiration", "Tenant", "Notes", "Market Rent", "Concessions", "Net Rent", "Start Date"]
}"""
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def create_rent_roll_analysis_prompt() -> PromptTemplate:
    """Create the prompt template for rent roll boundary analysis."""
    template = """
You are an expert at analyzing commercial real estate rent roll documents. Your task is to identify where the actual unit data begins and ends, AND identify the column headers that describe each column of data.

The following data has been extracted from a {file_type} file. Use the following data structure: {file_type_data_structure}

Analyze the following rent roll data and identify:
1. The boundaries for unit data extraction
2. The column headers that describe each column of relevant data

Return your analysis in this exact JSON format:

{file_type_data_structure}

**ANALYSIS RULES:**

1. **Column Header Identification:**
   - Look for the row that contains column names for the relevant data (e.g., "Unit", "Type", "Status", "Rent", "Lease Exp")
   - Common headers: Unit, Unit Type, Status, Size (SF), Rent, Lease Expiration, Tenant, etc.
   - Headers may be abbreviated or use different terminology
   - Maintain the order of the headers as they appear in the data, as we will use this order to extract the data later

2. **Unit Data Identification:**
   - Look for rows/entries that contain unit numbers (e.g., "101", "1A", "Apt 1")
   - Look for rent amounts, unit types, and lease information
   - Be inclusive of admin and commercial units.
   - Unit data typically has: Unit Number, Unit Type, Status, Rent, Lease Expiration

3. **Boundary Detection:**
   - Start: First row/entry that contains actual unit data (skip headers, assumptions)
   - End: Last row/entry that contains unit data. It is essential that you do not decide on an end row until you have looked at the entirety of the text provided to you.
   - Once you decide the end row, make sure you extract the entire row, not just the unit number.

4. **Exclusion Patterns:**
   - Unit Mix summaries (e.g., "1BR: 45 units", "Unit Mix Summary")
   - Total summaries (e.g., "Total Units", "Total Rent")
   - Assumptions and notes
   - Headers and footers

5. **Confidence Levels:**
   - "high": Clear boundaries, consistent unit data format, clear headers
   - "medium": Some ambiguity but reasonable boundaries and headers
   - "low": Unclear boundaries or inconsistent format, unclear headers

You will not return a response until you have looked at the entirety of the text provided to you.
You will not return a response early until you are absolutely certain that the end row you have identified is the last relevant row.

**EXAMPLES:**

Good unit data:
```
Unit 101    1BR    Occupied    $1,500   12/31/2024
Unit 102    1BR    Vacant      $0       null
Unit 103    2BR    Occupied    $2,200   06/30/2025
```

Exclude these:
```
Unit Mix Summary:
1BR: 45 units
2BR: 30 units
Total: 75 units
```

**EXAMPLE OUTPUT FROM ANOTHER DEAL:**

{file_type_example_output}

Here is the rent roll data to analyze:
{text}

JSON Response:
"""

    return PromptTemplate(
        input_variables=["file_type", "file_type_data_structure", "file_type_example_output", "text"],
        template=template
    )
