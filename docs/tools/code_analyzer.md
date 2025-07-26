# Tool: `code_analyzer`

## Description
Analyzes source code files to extract structured information about their components, dependencies, and potential issues. This tool provides a deeper understanding of the codebase beyond simple text search, aiding in code review, planning changes, and identifying areas for improvement.

## Parameters

*   `file_path`:
    *   **Type:** `string`
    *   **Required:** `true`
    *   **Description:** The absolute path to the source code file to analyze.
*   `analysis_type`:
    *   **Type:** `string`
    *   **Required:** `true`
    *   **Description:** The type of analysis to perform.
    *   **Allowed Values:**
        *   `"overview"`: Provides a high-level summary of the file, including defined functions/methods, classes, and top-level variables.
        *   `"imports"`: Lists all modules or components imported by the file, along with their source paths.
        *   `"exports"`: Lists all entities exported by the file.
        *   `"function_details"`: Provides details for a specific function or method, including its parameters, local variables, and calls to other functions. Requires `entity_name`.
        *   `"class_details"`: Provides details for a specific class, including its methods, properties, and inheritance. Requires `entity_name`.
        *   `"dependencies"`: Lists external dependencies (e.g., npm packages, other local modules) used by the file.
        *   `"call_graph"`: (Conceptual, more advanced) Shows functions called by functions within the file, and optionally, functions that call functions within this file.
*   `entity_name`:
    *   **Type:** `string`
    *   **Required:** `false`
    *   **Description:** The name of a specific function, method, or class to get detailed information about. Required for `"function_details"` and `"class_details"`.

## Example Usage

*   **Get an overview of `backend/src/game/phases.ts`:**
    ```
    code_analyzer(file_path="C:/Users/mkibb/Desktop/_logisticore/backend/src/game/phases.ts", analysis_type="overview")
    ```

*   **List all imports in `App.tsx`:**
    ```
    code_analyzer(file_path="C:/Users/mkibb/Desktop/_logisticore/App.tsx", analysis_type="imports")
    ```

*   **Get details about the `handleCombatPhase` function in `backend/src/game/phases.ts`:**
    ```
    code_analyzer(file_path="C:/Users/mkibb/Desktop/_logisticore/backend/src/game/phases.ts", analysis_type="function_details", entity_name="handleCombatPhase")
    ```

*   **List external dependencies of `backend/src/server.ts`:**
    ```
    code_analyzer(file_path="C:/Users/mkibb/Desktop/_logisticore/backend/src/server.ts", analysis_type="dependencies")
    ```

## Benefits and Distinction from Existing Tools

*   **Structured Code Understanding:** Unlike `read_file` (raw text) or `search_file_content` (text matches), `code_analyzer` would parse the code to understand its syntactic and semantic structure, providing actionable, structured data.
*   **Impact Analysis:** By querying for imports, exports, and function details, I can better understand the ripple effect of a change. If a user asks to modify a specific function, I can use this tool to see what other parts of the codebase might be affected.
*   **Code Review Efficiency:** Quickly grasp the architecture of unfamiliar files or modules without manually reading through every line.
*   **Planning Changes:** Helps in outlining refactoring steps by providing a clear picture of code organization and relationships.
*   **Complements Existing Tools:** It would work in conjunction with `read_file` (to get the code content), `run_shell_command` (to execute linters/tests), and `save_memory` (to store analysis findings).

## Integration with Gemini CLI

To make the `code_analyzer` tool available in a Gemini CLI-like environment, you would typically add its definition to the `coreTools` array within a `settings.json` file. This allows the CLI to discover and utilize the tool.

**Example `settings.json` entry:**

```json
{
  "coreTools": [
    "code_analyzer(file_path, analysis_type, entity_name)",
    // ... other tools
  ]
}
```

This entry informs the Gemini CLI about the `code_analyzer` tool and its expected parameters, making it discoverable and usable within the environment.

## Evolution and Self-Review

This document serves as a living specification for the `code_analyzer` tool. As we use it, we will iterate on its capabilities, refine its parameters, and expand its `analysis_type` options based on practical needs and insights gained from its application. This iterative process embodies the principle of continuous self-review and improvement, ensuring the tool remains highly effective and adaptable across various software engineering tasks and projects.
