import React from 'react';
import ToolCard from './ToolCard';
import ChatMessageMarkdown from '../../../components/ChatMessageMarkdown';
import { AgentToolsProps } from '../xstates/agentThink';
import { useTranslation } from 'react-i18next';
import { PiCircleNotchBold } from 'react-icons/pi';
import { RelatedDocument } from '../../../@types/conversation';
import { removeThinkingContent, shouldFilterThinkingContent } from '../../../utils/textFilter';

type AgentToolListProps = {
  messageId: string;
  tools: AgentToolsProps;
  relatedDocuments?: RelatedDocument[];
};

const AgentToolList: React.FC<AgentToolListProps> = ({messageId, tools, relatedDocuments}) => {
  const { t } = useTranslation();
  const isRunning = (
    Object.keys(tools.tools).length === 0 ||
    Object.values(tools.tools).some(tool => tool.status === 'running')
  );
  
  // Filter thinking content from the thought text
  const filteredThought = tools.thought && shouldFilterThinkingContent() 
    ? removeThinkingContent(tools.thought)
    : tools.thought;
  
  // Only show the thought section if there's filtered content remaining
  const shouldShowThought = filteredThought && filteredThought.trim().length > 0;
  
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col rounded border border-gray bg-aws-paper-light dark:bg-aws-paper-dark text-aws-font-color-light/80 dark:text-aws-font-color-dark/80">
      {(isRunning || shouldShowThought) && (
        <div className="flex items-center border-b border-gray p-2 last:border-b-0">
          {isRunning && <PiCircleNotchBold className="mr-2 animate-spin" />}
          {shouldShowThought ? (
            <ChatMessageMarkdown
              messageId={messageId}
              relatedDocuments={relatedDocuments}
            >
              {filteredThought}
            </ChatMessageMarkdown>
          ) : t('agent.progress.label')}
        </div>
      )}

      {Object.entries(tools.tools).map(([toolUseId, toolUse]) => (
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
