import React, { ReactNode, useMemo } from 'react';
import { BaseProps } from '../@types/common';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import ButtonDownload from './ButtonDownload';
import ButtonCopy from './ButtonCopy';
import { RelatedDocument } from '../@types/conversation';
import { twMerge } from 'tailwind-merge';
import { create } from 'zustand';
import { produce } from 'immer';
import rehypeExternalLinks, { Options } from 'rehype-external-links';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { onlyText } from 'react-children-utilities';

// Animated typing indicator component
const TypingIndicator = () => {
  return (
    <span className="inline-flex items-center ml-1 space-x-1">
      <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
    </span>
  );
};
import RelatedDocumentViewer from './RelatedDocumentViewer';

type Props = BaseProps & {
  children: string;
  isStreaming?: boolean;
  relatedDocuments?: RelatedDocument[];
  messageId: string;
};

const useRelatedDocumentsState = create<{
  relatedDocuments: {
    [key: string]: RelatedDocument;
  };
  setRelatedDocument: (key: string, relatedDocument: RelatedDocument) => void;
  resetRelatedDocument: (key: string) => void;
}>((set, get) => ({
  relatedDocuments: {},
  setRelatedDocument: (key, relatedDocument) => {
    set({
      relatedDocuments: produce(get().relatedDocuments, (draft) => {
        draft[key] = relatedDocument;
      }),
    });
  },
  resetRelatedDocument: (key) => {
    set({
      relatedDocuments: produce(get().relatedDocuments, (draft) => {
        delete draft[key];
      }),
    });
  },
}));

const RelatedDocumentLink: React.FC<{
  relatedDocument?: RelatedDocument;
  sourceId: string;
  linkId: string;
  children: ReactNode;
}> = (props) => {
  const { relatedDocuments, setRelatedDocument, resetRelatedDocument } = useRelatedDocumentsState();

  return (
    <>
      <a
        className={twMerge(
          'mx-0.5 ',
          props.relatedDocument != null
            ? 'cursor-pointer text-aws-sea-blue-light dark:text-aws-sea-blue-dark hover:text-aws-sea-blue-hover-light dark:hover:text-aws-sea-blue-hover-dark'
            : 'cursor-not-allowed text-gray'
        )}
        onClick={() => {
          if (props.relatedDocument != null) {
            setRelatedDocument(props.linkId, props.relatedDocument);
          }
        }}>
        {props.children}
      </a>

      {relatedDocuments[props.linkId] && (
        <RelatedDocumentViewer
          relatedDocument={relatedDocuments[props.linkId]}
          onClick={() => {
            resetRelatedDocument(props.linkId);
          }}
        />
      )}
    </>
  );
};

const ChatMessageMarkdown: React.FC<Props> = ({
  className,
  children,
  isStreaming,
  relatedDocuments,
  messageId,
}) => {
  const sourceIds = useMemo(() => {
    // Remove thinking process content first before extracting source IDs
    // Only filter in production unless VITE_SHOW_THINKING_PROCESS is set to true
    const shouldHideThinkingProcess = import.meta.env.VITE_SHOW_THINKING_PROCESS !== 'true';
    
    let cleanedChildren = children;
    if (shouldHideThinkingProcess) {
      cleanedChildren = cleanedChildren.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
      cleanedChildren = cleanedChildren.replace(/<thinking>[\s\S]*$/g, '');
    }
    
    return [...new Set(Array.from(
      cleanedChildren.matchAll(/\[\^(?<sourceId>[\w!?/+\-_~=;.,*&@#$%]+?)\]/g),
      match => match.groups!.sourceId,
    ))];
  }, [children]);

  const text = useMemo(() => {
    // Remove thinking process content first
    // Only filter in production unless VITE_SHOW_THINKING_PROCESS is set to true
    const shouldHideThinkingProcess = import.meta.env.VITE_SHOW_THINKING_PROCESS !== 'true';
    
    let cleanedChildren = children;
    if (shouldHideThinkingProcess) {
      // Remove complete thinking tags
      cleanedChildren = cleanedChildren.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
      // Remove incomplete thinking tags (for streaming)
      cleanedChildren = cleanedChildren.replace(/<thinking>[\s\S]*$/g, '');
    }
    
    const textRemovedIncompleteCitation = cleanedChildren.replace(/\[\^[^\]]*?$/, '[^');
    let textReplacedSourceId = textRemovedIncompleteCitation.replace(
      /\[\^(?<sourceId>[\w!?/+\-_~=;.,*&@#$%]+?)\]/g,
      (_, sourceId) => {
        const index = sourceIds.indexOf(sourceId);
        if (index === -1) {
          return '';
        }
        return `[^${index + 1}]`
      },
    );

    // Simple approach: only allow $$ for math, escape single $ that are not part of valid math
    // This regex looks for $ that are not followed by another $ and not preceded by another $
    // Examples:
    // - "$5.99" becomes "\$5.99" (not processed as math)
    // - "$x + y$" becomes "\$x + y\$" (not processed as math)
    // - "$$x + y$$" stays "$$x + y$$" (processed as block math)
    textReplacedSourceId = textReplacedSourceId.replace(
      /(?<!\$)\$(?!\$)/g,
      '\\$'
    );

    if (isStreaming) {
      // Remove the text symbol approach, we'll add a React component instead
    }

    // Default Footnote link is not shown, so set dummy
    if (sourceIds.length > 0) {
      textReplacedSourceId += `\n${sourceIds.map((_, index) => `[^${index + 1}]: dummy`).join('\n')}`;
    }

    return textReplacedSourceId;
  }, [children, isStreaming, sourceIds]);

  const remarkPlugins = useMemo(() => {
    return [remarkGfm, remarkBreaks, remarkMath];
  }, []);
  const rehypePlugins = useMemo(() => {
    const rehypeExternalLinksOptions: Options = {
      target: '_blank',
      properties: { style: 'word-break: break-word;' },
    };
    return [rehypeKatex, [rehypeExternalLinks, rehypeExternalLinksOptions]];
  }, []);

  return (
    <>
      <ReactMarkdown
        className={twMerge(className, 'prose dark:prose-invert max-w-full break-words')}
        children={text}
        remarkPlugins={remarkPlugins}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        rehypePlugins={rehypePlugins}
        components={{
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeText = onlyText(children).replace(/\n$/, '');

          return !inline && match ? (
            <CopyToClipboard codeText={codeText}>
              <SyntaxHighlighter
                {...props}
                children={codeText}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                wrapLongLines={true}
                customStyle={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '100%'
                }}
                className="code-block-wrap"
              />
            </CopyToClipboard>
          ) : (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        sup({ className, children }) {
          // Footnote's Link is replaced with a component that displays the Reference document
          return (
            <sup className={className}>
              {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                children.map((child, idx) => {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  if (child?.props['data-footnote-ref']) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const href: string = child.props.href ?? '';
                    if (/#user-content-fn-[\d]+/.test(href ?? '')) {
                      const docNo = Number.parseInt(
                        href.replace('#user-content-fn-', '')
                      );
                      const sourceId = sourceIds[docNo - 1];
                      const relatedDocument = relatedDocuments?.find(document => (
                        document.sourceId === sourceId || document.sourceId === `${messageId}@${sourceId}`
                      ));

                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      const refNo = child.props.children[0];
                      return (
                        <RelatedDocumentLink
                          key={`${idx}-${docNo}`}
                          linkId={`${messageId}-${idx}-${docNo}`}
                          relatedDocument={relatedDocument}
                          sourceId={sourceId}
                        >
                          [{refNo}]
                        </RelatedDocumentLink>
                      );
                    }
                  }
                  return child;
                })
              }
            </sup>
          );
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        section({ className, children, ...props }) {
          // Normal Footnote not shown for RAG reference documents
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (props['data-footnotes']) {
            return null;
          } else {
            return <section className={className}>{children}</section>;
          }
        },
      }}
    />
    {isStreaming && <TypingIndicator />}
    </>
  );
};

const CopyToClipboard = ({
  children,
  codeText,
}: {
  children: React.ReactNode;
  codeText: string;
}) => {
  return (
    <div className="relative max-w-full overflow-hidden">
      {children}
      <div className="absolute right-2 top-2 flex gap-0">
        <ButtonDownload text={codeText} />
        <ButtonCopy text={codeText} />
      </div>
    </div>
  );
};

export default ChatMessageMarkdown;
