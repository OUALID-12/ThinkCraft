import React, { useEffect, useRef, useState } from 'react';
import * as joint from 'jointjs';
import './DiagramEditor.css';

const DiagramEditor = () => {
  const graph = useRef(new joint.dia.Graph());
  const paper = useRef(null);

  const [classForm, setClassForm] = useState({ className: '', attributes: '', methods: '' });
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [sourceClass, setSourceClass] = useState(null);
  const [targetClass, setTargetClass] = useState(null);
  const [sourceCardinality, setSourceCardinality] = useState('');
  const [targetCardinality, setTargetCardinality] = useState('');
  const [relationships, setRelationships] = useState([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('Python');

  useEffect(() => {
    paper.current = new joint.dia.Paper({
      el: document.getElementById('diagram-container'),
      model: graph.current,
      padding: 50,
      width: 4200,
      height: 980,
      gridSize: 10,
      drawGrid: true,
      background: { color: '#f9f9f9' },
    });
  }, []);

  const addClass = () => {
    const { className, attributes, methods } = classForm;
  
    if (!className.trim()) {
      alert('Class name is required.');
      return;
    }
  
    const parsedAttributes = attributes
      .split('\n')
      .map((attr) => {
        const [name, type = 'String'] = attr.split(':').map((str) => str.trim());
        return {  name, type }; 
      })
      .filter((attr) => attr.name); 
  
    const parsedMethods = methods.split('\n').map((method) => method.trim()).filter((method) => method);
  
    const umlClass = new joint.shapes.uml.Class({
      position: { x: Math.random() * 800, y: Math.random() * 400 },
      size: { width: 200, height: 150 },
      name: className,
      attributes: parsedAttributes.map((attr) => `${attr.name}: ${attr.type}`),
      methods: parsedMethods,
      attrs: {
        '.uml-class-name-rect': { fill: '#4c66af', stroke: '#333', 'stroke-width': 2 },
        '.uml-class-attrs-rect': { fill: '#E8F5E9', stroke: '#333', 'stroke-width': 2 },
        '.uml-class-methods-rect': { fill: '#E8F5E9', stroke: '#333', 'stroke-width': 2 },
        '.uml-class-name-text': { text: className, fill: '#fff', 'font-size': 14, 'font-weight': 'bold' },
        '.uml-class-attrs-text': {
          text: parsedAttributes.map((attr) => `${attr.name}: ${attr.type}`).join('\n'),
          fill: '#333',
          'font-size': 12,
        },
        '.uml-class-methods-text': { text: parsedMethods.join('\n'), fill: '#333', 'font-size': 12 },
      },
    });
  
    graph.current.addCell(umlClass);
    setClasses((prevClasses) => [...prevClasses, umlClass]);
    setClassForm({ className: '', attributes: '', methods: '' });
  };
  

  const deleteClass = () => {
    if (!selectedClass) {
      alert('Please select a class to delete.');
      return;
    }

    graph.current.getCell(selectedClass.id).remove();
    setClasses((prevClasses) => prevClasses.filter((c) => c.id !== selectedClass.id));
    setSelectedClass(null);
  };

  const editClassAttributes = () => {
    if (!selectedClass) {
      alert('Please select a class to edit.');
      return;
    }

    const newAttributes = prompt('Enter new attributes (one per line):', selectedClass.attributes.attributes.join('\n'));
    const newMethods = prompt('Enter new methods (one per line):', selectedClass.attributes.methods.join('\n'));

    if (newAttributes !== null) {
      selectedClass.attributes.attributes = newAttributes.split('\n');
    }
    if (newMethods !== null) {
      selectedClass.attributes.methods = newMethods.split('\n');
    }

    const updatedAttrs = {
      ...selectedClass.attributes.attrs,
      '.uml-class-attrs-text': { text: newAttributes, fill: '#333', 'font-size': 12 },
      '.uml-class-methods-text': { text: newMethods, fill: '#333', 'font-size': 12 },
    };

    selectedClass.attr(updatedAttrs);
    setSelectedClass(null);
  };

  const addRelationship = (type) => {
    if (sourceClass && targetClass) {
      const link = new joint.shapes.standard.Link({
        source: { id: sourceClass.id },
        target: { id: targetClass.id },
        attrs: { line: { stroke: '#333', strokeWidth: 2 } },
      });

      if (type === 'association') {
        link.appendLabel({ attrs: { text: { text: 'Association', fill: '#333' } } });
      } else if (type === 'aggregation') {
        link.attr('line/sourceMarker', { type: 'circle', fill: 'white' });
        link.appendLabel({ attrs: { text: { text: 'Aggregation', fill: '#333' } } });
      } else if (type === 'composition') {
        link.attr('line/sourceMarker', { type: 'diamond', fill: 'black' });
        link.appendLabel({ attrs: { text: { text: 'Composition', fill: '#333' } } });
      } else if (type === 'inheritance') {
        link.attr('line/targetMarker', { type: 'path', d: 'M 10 -5 L 0 0 L 10 5 Z', fill: 'black' });
        link.appendLabel({ attrs: { text: { text: 'Inheritance', fill: '#333' } } });
        setRelationships((prev) => [...prev, { parent: sourceClass.attributes.name, child: targetClass.attributes.name }]);
      }

      if (sourceCardinality) {
        link.appendLabel({
          position: 0.1,
          attrs: { text: { text: sourceCardinality, fill: '#333', 'font-size': 12 } },
        });
      }
      if (targetCardinality) {
        link.appendLabel({
          position: 0.9,
          attrs: { text: { text: targetCardinality, fill: '#333', 'font-size': 12 } },
        });
      }

      graph.current.addCell(link);
      setSourceClass(null);
      setTargetClass(null);
      setSourceCardinality('');
      setTargetCardinality('');
    } else {
      alert('Please select both a source and a target class.');
    }
  };

  const generateCode = () => {
    const cells = graph.current.getCells();
    let code = '';
  
    const getClassDetails = (className) => {
      const classCell = cells.find((cell) => cell.isElement() && cell.attributes.name === className);
      if (!classCell) return { attributes: [], methods: [] };
  
      const attributes = classCell.attributes.attributes.map((attr) => {
        const [name, type] = attr.split(':').map((str) => str.trim());
        return { name, type };
      });
      const methods = classCell.attributes.methods;
  
      return { attributes, methods };
    };
  
    cells.forEach((cell) => {
      if (cell.isElement() && cell.attributes.type === 'uml.Class') {
        const className = cell.attributes.name;
        const attributes = cell.attributes.attributes.map((attr) => {
          const [name, type] = attr.split(':').map((str) => str.trim());
          return { name, type };
        });
        const methods = cell.attributes.methods;
  
        const inheritance = relationships.find((rel) => rel.child === className);
        const parentClass = inheritance ? inheritance.parent : null;
  
        let parentDetails = { attributes: [], methods: [] };
        if (parentClass) {
          parentDetails = getClassDetails(parentClass);
        }
  
        if (codeLanguage === 'Python') {
          code += `class ${className}${parentClass ? `(${parentClass})` : ''}:\n`;
          code += `    def __init__(self${attributes.length > 0 ? `, ${attributes.map((attr) => attr.name).join(', ')}` : ''}${parentDetails.attributes.length > 0 ? `, ${parentDetails.attributes.map((attr) => attr.name).join(', ')}` : ''}):\n`;
          if (parentClass) {
            code += `        super().__init__(${parentDetails.attributes.map((attr) => attr.name).join(', ')})\n`;
          }
          attributes.forEach((attr) => {
            code += `        self.${attr.name} = ${attr.name}  # ${attr.type}\n`;
          });
          if (!attributes.length && !parentClass) {
            code += `        pass\n`;
          }
          if (methods.length > 0) {
            code += `\n    # Methods\n`;
            methods.forEach((method) => {
              code += `    def ${method}(self):\n        pass\n`;
            });
          }
          code += '\n';
        }
  
        if (codeLanguage === 'Java') {
          code += `public class ${className}${parentClass ? ` extends ${parentClass}` : ''} {\n`;
          attributes.forEach((attr) => {
            code += `    private ${attr.type} ${attr.name};\n`;
          });
          if (attributes.length > 0) {
            code += `\n    public ${className}(${attributes.map((attr) => `${attr.type} ${attr.name}`).concat(parentDetails.attributes.map((attr) => `${attr.type} ${attr.name}`)).join(', ')}) {\n`;
            if (parentClass) {
              code += `        super(${parentDetails.attributes.map((attr) => attr.name).join(', ')});\n`;
            }
            attributes.forEach((attr) => {
              code += `        this.${attr.name} = ${attr.name};\n`;
            });
            code += '    }\n';
          }
          methods.forEach((method) => {
            code += `    public void ${method}() {\n        \n    }\n`;
          });
          code += '}\n\n';
        }
  
        if (codeLanguage === 'PHP') {
          code += `class ${className}${parentClass ? ` extends ${parentClass}` : ''} {\n`;
          attributes.forEach((attr) => {
            code += `    private $${attr.name};  // ${attr.type}\n`;
          });
          if (attributes.length > 0) {
            code += `\n    public function __construct(${attributes.map((attr) => `$${attr.name}`).concat(parentDetails.attributes.map((attr) => `$${attr.name}`)).join(', ')}) {\n`;
            if (parentClass) {
              code += `        parent::__construct(${parentDetails.attributes.map((attr) => `$${attr.name}`).join(', ')});\n`;
            }
            attributes.forEach((attr) => {
              code += `        $this->${attr.name} = $${attr.name};\n`;
            });
            code += '    }\n';
          }
          methods.forEach((method) => {
            code += `    public function ${method}() {\n        // TODO: Implement\n    }\n`;
          });
          code += '}\n\n';
        }
      }
    });
  
    setGeneratedCode(code);
  };
  
  
  

  const downloadCode = () => {
    if (!generatedCode) {
      alert('No code to download. Generate code first!');
      return;
    }
    const element = document.createElement('a');
    const file = new Blob([generatedCode], { type: 'text/plain' });
    const extension = codeLanguage.toLowerCase();
    element.href = URL.createObjectURL(file);
    element.download = `generated_code.${extension}`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="diagram-editor">
      <div className='AA'>
      <div className="toolbar">
        <div className="class-form">
          <div className='text'>
          <input
            type="text"
            placeholder="Class Name"
            value={classForm.className}
            onChange={(e) => setClassForm({ ...classForm, className: e.target.value })}
          />
          </div>
          <textarea
                placeholder="Attributes (name:type, one per line, e.g., age:int)"
                value={classForm.attributes}
                onChange={(e) => setClassForm({ ...classForm, attributes: e.target.value })}
/>

          <textarea
            placeholder="Methods (one per line)"
            value={classForm.methods}
            onChange={(e) => setClassForm({ ...classForm, methods: e.target.value })}
          />
          <div className='text1'>
          <button onClick={addClass}>Add Class</button>
          </div>
        </div>

        <div className="code-generation">
          <select value={selectedClass?.id || ''} onChange={(e) => setSelectedClass(classes.find((c) => c.id === e.target.value))}>
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.attributes.name}
              </option>
            ))}
          </select>
          
          <button onClick={editClassAttributes}>Edit Class</button>
          <button onClick={deleteClass}>Delete Class</button>
        </div>

        <div className="code-generation">
          <select value={sourceClass?.id || ''} onChange={(e) => setSourceClass(classes.find((c) => c.id === e.target.value))}>
            <option value="">Select Source Class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.attributes.name}
              </option>
            ))}
          </select>
          <select value={targetClass?.id || ''} onChange={(e) => setTargetClass(classes.find((c) => c.id === e.target.value))}>
            <option value="">Select Target Class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.attributes.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Source Cardinality (e.g., 1)"
            value={sourceCardinality}
            onChange={(e) => setSourceCardinality(e.target.value)}
          />
          
          <input
            type="text"
            placeholder="Target Cardinality (e.g., N)"
            value={targetCardinality}
            onChange={(e) => setTargetCardinality(e.target.value)}
          />
          <button onClick={() => addRelationship('association')}>Add Association</button>
          <button onClick={() => addRelationship('aggregation')}>Add Aggregation</button>
          <button onClick={() => addRelationship('composition')}>Add Composition</button>
          <button onClick={() => addRelationship('inheritance')}>Add Inheritance</button>
        </div>

        <div className="code-generation">
          <select value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)}>
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="PHP">PHP</option>
          </select>
          <button onClick={generateCode}>Generate Code</button>
          <button onClick={downloadCode}>Download Code</button>
        </div>
      </div>
      </div>

      <div id="diagram-container"></div>
      {generatedCode && (
        <div className="code-output">
          <h4>Generated Code:</h4>
          <pre>{generatedCode}</pre>
        </div>
      )}
    </div>
  );
};

export default DiagramEditor;
