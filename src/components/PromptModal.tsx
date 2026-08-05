import React, { useState } from 'react';
import { Report } from '../types';
import { X, Copy, Check, Sparkles, Code2, Bot } from 'lucide-react';

interface PromptModalProps {
  report: Report | null;
  onClose: () => void;
  onExpandWithAI: (report: Report) => Promise<string>;
}

export const PromptModal: React.FC<PromptModalProps> = ({ report, onClose, onExpandWithAI }) => {
  if (!report) return null;

  // Build standard template with placeholders
  const defaultTemplate = `CONTEXTO
Módulo: [PREENCHER — módulo/tela do RC OS onde ocorre]
Comportamento base do sistema: [PREENCHER — como o sistema deveria funcionar normalmente]
Caso de referência:
Link informado pelo usuário: ${report.link}
Autor do report: ${report.autor_nome}
Tipo: ${report.tipo}  |  Prioridade: ${report.prioridade}

PROBLEMA
${report.descricao}
[PREENCHER — complementar com detalhamento técnico, se necessário]

COMPORTAMENTO ESPERADO
[PREENCHER — descrever a solução principal esperada]
[PREENCHER — solução secundária / fallback, se houver]

O QUE PRECISA SER INVESTIGADO / CORRIGIDO
1. [PREENCHER]
2. [PREENCHER]
3. [PREENCHER]

VALIDAÇÃO
- [PREENCHER — passo de teste 1]
- [PREENCHER — passo de teste 2]
- [PREENCHER — confirmar que cálculos/indexações dependentes refletem a correção]`;

  const [promptText, setPromptText] = useState(defaultTemplate);
  const [copied, setCopied] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAIExpand = async () => {
    setExpanding(true);
    try {
      const expanded = await onExpandWithAI(report);
      if (expanded) {
        setPromptText(expanded);
        setIsAiGenerated(true);
      }
    } catch (err: any) {
      alert('Erro ao gerar com IA: ' + (err?.message || 'Falha de comunicação'));
    } finally {
      setExpanding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Prompt Técnico Gerado</h3>
              <p className="text-xs text-slate-500">Formatação técnica para o report: "{report.titulo}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Modelo Técnico de Correção (Sleek Interface)
            </div>
            <button
              onClick={handleAIExpand}
              disabled={expanding}
              className="px-4 py-1.5 text-xs font-black bg-brand-yellow hover:bg-[#EBB019] text-brand-dark rounded-full shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {expanding ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Gerando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-slate-900" /> Preencher com IA (Gemini API)
                </>
              )}
            </button>
          </div>

          {isAiGenerated && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs flex items-center gap-2 font-medium">
              <Bot className="w-4 h-4 text-amber-600 shrink-0" />
              Prompt técnico expandido inteligentemente via Gemini API!
            </div>
          )}

          <div className="relative">
            <textarea
              readOnly
              rows={15}
              value={promptText}
              className="w-full font-mono text-[11px] bg-[#F8F5EC] text-slate-800 p-4 rounded-xl border border-brand-warm leading-relaxed outline-none resize-none selection:bg-amber-400 selection:text-slate-900"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-brand-warm bg-[#F8F5EC] flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-mono">
            PROMPT TÉCNICO READY
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/80 rounded-full transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handleCopy}
              className={`px-5 py-2.5 text-xs font-black rounded-full shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-yellow hover:bg-[#EBB019] text-brand-dark'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" /> COPIADO!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-900" /> COPIAR PROMPT
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
