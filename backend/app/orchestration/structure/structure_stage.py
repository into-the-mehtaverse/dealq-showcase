"""
Structure Stage

Handles structuring of extracted data using the structuring service.
Takes RR precision extraction models and T12 plain text and returns structured results.
"""

from typing import Optional, List, Dict, Any
import asyncio
from fastapi import HTTPException

from app.models.orchestration.structure_stage import StructureStageInput, StructureStageOutput
from app.services.underwriting.structuring.service import StructuringService
from app.orchestration._shared.error_utils import log_stage_error, aggregate_error_messages, determine_stage_success


class StructureStage:
    """Pipeline stage for handling data structuring."""

    def __init__(
        self,
        structuring_service: StructuringService = None
    ):
        """Initialize the structure stage with services."""
        self.structuring_service = structuring_service or StructuringService()

    async def process_structure(
        self,
        input_data: StructureStageInput
    ) -> StructureStageOutput:
        """
        Process structuring of extracted data.

        Args:
            input_data: StructureStageInput containing RR extraction and T12 plain text

        Returns:
            StructureStageOutput with structured results
        """
        try:
            print(f"Processing structure stage")
            print(f"RR extraction provided: {input_data.rr_extraction is not None}")
            print(f"T12 plain text provided: {input_data.t12_plain_text is not None}")

            structured_rent_roll = None
            structured_t12 = None
            errors = []

            # Create concurrent tasks for RR and T12 structuring
            tasks = []

            if input_data.rr_extraction:
                print(f"Creating RR structuring task...")

                # Log column headers if available
                if hasattr(input_data.rr_extraction, 'boundaries') and input_data.rr_extraction.boundaries:
                    column_headers = input_data.rr_extraction.boundaries.get('column_headers', [])
                    if column_headers:
                        print(f"  RR extraction includes {len(column_headers)} column headers: {column_headers}")
                    else:
                        print(f"  RR extraction has no column headers")



                rr_task = asyncio.create_task(
                    self.structuring_service.structure_rent_roll_data(input_data.rr_extraction)
                )
                tasks.append(("RR", rr_task))

            if input_data.t12_plain_text:
                print(f"Creating T12 structuring task...")
                t12_task = asyncio.create_task(
                    self.structuring_service.structure_t12_data(input_data.t12_plain_text)
                )
                tasks.append(("T12", t12_task))

            # Execute all tasks concurrently
            if tasks:
                print(f"Executing {len(tasks)} structuring tasks concurrently...")
                results = await asyncio.gather(*[task for _, task in tasks], return_exceptions=True)

                # Process results and handle any exceptions
                for i, (task_name, _) in enumerate(tasks):
                    try:
                        if isinstance(results[i], Exception):
                            error_msg = f"{task_name} structuring failed: {str(results[i])}"
                            log_stage_error("Structure", results[i], component=f"{task_name} structuring")
                            errors.append(error_msg)
                            print(f"{task_name} structuring failed: {str(results[i])}")
                        else:
                            if task_name == "RR":
                                structured_rent_roll = results[i]
                                print(f"RR structuring completed: {len(structured_rent_roll) if structured_rent_roll else 0} units")
                            elif task_name == "T12":
                                structured_t12 = results[i]
                                print(f"T12 structuring completed: {len(structured_t12) if structured_t12 else 0} items")
                    except Exception as e:
                        error_msg = f"{task_name} structuring result processing failed: {str(e)}"
                        log_stage_error("Structure", e, component=f"{task_name} result processing")
                        errors.append(error_msg)
                        print(f"{task_name} result processing failed: {str(e)}")

            # Determine overall success
            structure_success = determine_stage_success(errors)
            error_message = aggregate_error_messages(errors)

            if structure_success:
                print(f"Structure stage completed successfully")
                print(f"  - RR units: {len(structured_rent_roll) if structured_rent_roll else 0}")
                print(f"  - T12 items: {len(structured_t12) if structured_t12 else 0}")
            else:
                print(f"Structure stage completed with errors: {error_message}")

            return StructureStageOutput(
                structured_rent_roll=structured_rent_roll,
                structured_t12=structured_t12,
                structure_success=structure_success,
                error_message=error_message
            )

        except Exception as e:
            log_stage_error("Structure", e)
            return StructureStageOutput(
                structured_rent_roll=None,
                structured_t12=None,
                structure_success=False,
                error_message=f"Structure stage failed: {str(e)}"
            )
