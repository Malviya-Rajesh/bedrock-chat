import React from 'react';
import ToolCard from './ToolCard';
import ChatMessageMarkdown from '../../../components/ChatMessageMarkdown';
import { AgentToolsProps } from '../xstates/agentThink';
import { useTranslation } from 'react-i18next';
import { PiCircleNotchBold } from 'react-icons/pi';
import { RelatedDocument } from '../../../@types/conversation';

type AgentToolListProps = {
  messageId: string;
  tools: AgentToolsProps;
  relatedDocuments?: RelatedDocument[];
};

const AgentToolList: React.FC<AgentToolListProps> = ({messageId, tools, relatedDocuments}) => {
  const { t } = useTranslation();
  
  // Filter out internet_search tools to hide thinking process in production
  // In development, you can set VITE_SHOW_THINKING_PROCESS=true to show the thinking process
  const shouldHideThinkingProcess = import.meta.env.VITE_SHOW_THINKING_PROCESS !== 'true';
  
  const filteredTools = shouldHideThinkingProcess 
    ? Object.fromEntries(
        Object.entries(tools.tools).filter(([, toolUse]) => toolUse.name !== 'internet_search')
      )
    : tools.tools;
  
  // Check if any non-internet_search tools are running
  const isRunning = (
    Object.keys(filteredTools).length === 0 ||
    Object.values(filteredTools).some(tool => tool.status === 'running')
  );
  
  // Also check if internet_search is the only tool running and hide the whole component (only in production)
  const hasOnlyInternetSearch = shouldHideThinkingProcess && 
    Object.keys(tools.tools).length > 0 && 
    Object.keys(filteredTools).length === 0 &&
    Object.values(tools.tools).every(tool => tool.name === 'internet_search');
  
  // Don't show the component if there are no tools to display and no thought, or if only internet_search is running
  if ((Object.keys(filteredTools).length === 0 && !tools.thought && !isRunning) || hasOnlyInternetSearch) {
    return null;
  }
  
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col rounded border border-gray bg-aws-paper-light dark:bg-aws-paper-dark text-aws-font-color-light/80 dark:text-aws-font-color-dark/80">
      {(isRunning || tools.thought) && !hasOnlyInternetSearch && (
        <div className="flex items-center border-b border-gray p-2 last:border-b-0">
          {isRunning && <PiCircleNotchBold className="mr-2 animate-spin" />}
          {tools.thought ? (
            <ChatMessageMarkdown
              messageId={messageId}
              relatedDocuments={relatedDocuments}
            >
              {tools.thought}
            </ChatMessageMarkdown>
          ) : t('agent.progress.label')}
        </div>
      )}

      {Object.entries(filteredTools).map(([toolUseId, toolUse]) => (
        <ToolCard
          className=" border-b border-gray last:border-b-0"
          key={toolUseId}
          toolUseId={toolUseId}
          name={toolUse.name}
          status={toolUse.status}
          input={toolUse.input}
          resultContents={toolUse.resultContents}
          relatedDocuments={toolUse.relatedDocuments}
        />
      ))}
    </div>
  );
};

export default AgentToolList;
