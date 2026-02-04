/**
 * Parses C code to simulate a sequential linear execution flow for Interactive Input.
 * detects printf (prompts) and scanf/fgets (inputs).
 * 
 * Returns:
 * {
 *   isComplex: boolean, // If loops/ifs detected, we might not be able to simulate perfectly
 *   steps: Array<{ type: 'print'|'input', content?: string, varName?: string }>
 * }
 */
export const parseCodeForInteractiveIO = (code) => {
    const lines = code.split('\n');
    const steps = [];
    let isComplex = false;
  
    // Simple heuristic to detect complexity that breaks linear simulation
    // If logic contains loops or conditionals, we can't pre-calculate the exact IO sequence easily.
    if (code.match(/\b(for|while|do|if|switch|goto)\b/)) {
      isComplex = true;
    }
  
    // Remove comments to avoid false positives
    const cleanCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  
    // Tokenize roughly by statements
    // This is a naive parser for the prototype
    const statements = cleanCode.split(';');
  
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      
      // Match printf("String content")
      const printfMatch = trimmed.match(/printf\s*\(\s*"([^"]*)"/);
      if (printfMatch) {
         // handle escaped newlines slightly for display
         let text = printfMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '    ');
         steps.push({ type: 'print', content: text });
      }
  
      // Match scanf("%d", &var) or fgets(buffer, size, stdin)
      const scanfMatch = trimmed.match(/scanf\s*\(/);
      const fgetsMatch = trimmed.match(/fgets\s*\(/);
      const cinMatch = trimmed.match(/cin\s*>>/); // C++ support just in case
      
      if (scanfMatch || fgetsMatch || cinMatch) {
        steps.push({ type: 'input' });
      }
    }
  
    return { isComplex, steps };
  };
