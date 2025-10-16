import { create } from 'zustand';
import { Model } from '../@types/conversation';
import { ModelItem } from '../@types/global-config';
import { AVAILABLE_MODEL_KEYS } from '../constants/index';
import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import useLocalStorage from './useLocalStorage';
import useGlobalConfig from './useGlobalConfig';
import { ActiveModels } from '../@types/bot';
import { toCamelCase } from '../utils/StringUtils';

const CLAUDE_SUPPORTED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const NOVA_SUPPORTED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const LLAMA_SUPPORTED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const DEFAULT_MODEL: Model = 'claude-v3.7-sonnet';

const useModelState = create<{
  modelId: Model;
  setModelId: (m: Model) => void;
}>((set) => ({
  modelId: DEFAULT_MODEL,
  setModelId: (m) => {
    set({
      modelId: m,
    });
  },
}));

// Store the Previous BotId
const usePreviousBotId = (botId: string | null | undefined) => {
  const ref = useRef<string | null | undefined>();

  useEffect(() => {
    ref.current = botId;
  }, [botId]);

  return ref.current;
};

const useModel = (botId?: string | null, activeModels?: ActiveModels) => {
  const { getGlobalConfig } = useGlobalConfig();
  const { data: globalConfig } = getGlobalConfig();

  const processedActiveModels = useMemo(() => {
    // Early return if activeModels is provided and not empty
    if (activeModels && Object.keys(activeModels).length > 0) {
      return activeModels;
    }

    // Create a new object with all models set to true
    return AVAILABLE_MODEL_KEYS.reduce((acc: ActiveModels, model: Model) => {
      // Optimize string replacement by doing it in one operation
      acc[toCamelCase(model) as keyof ActiveModels] = true;
      return acc;
    }, {} as ActiveModels);
  }, [activeModels]);

  const previousBotId = usePreviousBotId(botId);

  const availableModels = useMemo<ModelItem[]>(() => {
    return [
      {
        modelId: 'claude-v3-haiku',
        label: 'Selira Spark (2024)',
        description:
          'Lightweight, lightning-fast model optimized for short answers and chat-style conversations.',
        supportMediaType: CLAUDE_SUPPORTED_MEDIA_TYPES,
        supportReasoning: false,
      },
      {
        modelId: 'claude-v3.5-haiku',
        label: 'Selira Spark v2 (2024)',
        description:
          'Enhanced version of Spark with improved reasoning and faster contextual understanding for professional use.',
        supportMediaType: CLAUDE_SUPPORTED_MEDIA_TYPES,
        supportReasoning: false,
      },
      {
        modelId: 'claude-v3.5-sonnet',
        label: 'Selira Core v2 (2024)',
        description:
          'Balanced model for reasoning, writing, and structured thinking — ideal for legal analysis, drafting, and summarization.',
        supportMediaType: CLAUDE_SUPPORTED_MEDIA_TYPES,
        supportReasoning: true,
      },
      {
        modelId: 'claude-v3-opus',
        label: 'Selira Prime (2024)',
        description:
          'High-performance reasoning model designed for complex logic, research tasks, and advanced drafting capabilities.',
        supportMediaType: CLAUDE_SUPPORTED_MEDIA_TYPES,
        supportReasoning: true,
      },
      // New Amazon Nova models
      {
        modelId: 'amazon-nova-pro',
        label: 'Selira Nova Pro',
        description:
          'Versatile multimodal AI for text, image, and structured reasoning with optimal cost-performance balance.',
        supportMediaType: NOVA_SUPPORTED_MEDIA_TYPES,
        supportReasoning: false,
      },
      {
        modelId: 'amazon-nova-lite',
        label: 'Selira Nova Lite',
        description:
          'Fast and efficient model for lightweight image and text tasks, ideal for quick assistant-style use cases.',
        supportMediaType: NOVA_SUPPORTED_MEDIA_TYPES,
        supportReasoning: false,
      },
      {
        modelId: 'amazon-nova-micro',
        label: 'Selira Nova Micro',
        description:
          'Ultra-low latency text-only model for quick responses and cost-sensitive applications.',
        supportMediaType: [],
        supportReasoning: false,
      },
      // DeepSeek models
      {
        modelId: 'deepseek-r1',
        label: 'Selira DeepLogic',
        description:
          'Advanced reasoning model for complex problem solving, mathematics, science, and structured explanations.',
        supportMediaType: [],
        supportReasoning: true,
        forceReasoningEnabled: true, // DeepSeek always returns reasoning content.
      },
      // Meta Llama 3 models
      {
        modelId: 'llama3-3-70b-instruct',
        label: 'Selira Luma Pro (70B)',
        description:
          'Large-scale reasoning and generation model optimized for multilingual and professional document analysis.',
        supportMediaType: [],
        supportReasoning: false,
      },
      {
        modelId: 'llama3-2-1b-instruct',
        label: 'Selira Luma Mini (1B)',
        description:
          'Lightweight model for on-device and mobile tasks, providing efficient natural language understanding.',
        supportMediaType: [],
        supportReasoning: false,
      },
      {
        modelId: 'llama3-2-3b-instruct',
        label: 'Selira Luma Lite (3B)',
        description:
          'Compact, responsive model optimized for short text generation and summarization tasks.',
        supportMediaType: [],
        supportReasoning: false,
      },
      {
        modelId: 'llama3-2-11b-instruct',
        label: 'Selira Luma Mid (11B)',
        description:
          'Powerful multimodal model capable of processing text and image inputs for smart document understanding.',
        supportMediaType: LLAMA_SUPPORTED_MEDIA_TYPES,
        supportReasoning: false,
      },
      {
        modelId: 'llama3-2-90b-instruct',
        label: 'Selira Luma Ultra (90B)',
        description:
          'High-end multimodal model offering strong reasoning and visual understanding for enterprise-grade use cases.',
        supportMediaType: LLAMA_SUPPORTED_MEDIA_TYPES,
        supportReasoning: false,
      }
    ].filter((model) => {
      // Filter based on global configuration if available
      if (
        globalConfig?.globalAvailableModels &&
        globalConfig.globalAvailableModels.length > 0
      ) {
        return globalConfig.globalAvailableModels.includes(model.modelId);
      }
      // If no global config, show all models
      return true;
    }) as ModelItem[];
  }, [globalConfig]);

  const [filteredModels, setFilteredModels] = useState(availableModels);
  const { modelId, setModelId } = useModelState();
  const [recentUseModelId, setRecentUseModelId] = useLocalStorage(
    'recentUseModelId',
    DEFAULT_MODEL
  );

  // Save the model id by each bot
  const [botModelId, setBotModelId] = useLocalStorage(
    botId ? `bot_model_${botId}` : 'temp_model',
    ''
  );

  // Update filtered models when activeModels changes
  useEffect(() => {
    if (processedActiveModels) {
      const filtered = availableModels.filter((model: ModelItem) => {
        const key = toCamelCase(model.modelId) as keyof ActiveModels;
        return processedActiveModels[key] !== false;
      });
      setFilteredModels(filtered);
    }
  }, [processedActiveModels, availableModels]);

  const getDefaultModel = useCallback(() => {
    // check default model is available
    const defaultModelAvailable = filteredModels.some(
      (m: ModelItem) => m.modelId === DEFAULT_MODEL
    );
    if (defaultModelAvailable) {
      return DEFAULT_MODEL;
    }
    // If the default model is not available, select the first model on the list
    return filteredModels[0]?.modelId ?? DEFAULT_MODEL;
  }, [filteredModels]);

  // select the model via list of activeModels
  const selectModel = useCallback(
    (targetModelId: Model) => {
      const modelExists = filteredModels.some(
        (m: ModelItem) => toCamelCase(m.modelId) === toCamelCase(targetModelId)
      );
      return modelExists ? targetModelId : getDefaultModel();
    },
    [filteredModels, getDefaultModel]
  );

  useEffect(() => {
    if (processedActiveModels === undefined) {
      return;
    }

    // botId is changed
    if (previousBotId !== botId) {
      // BotId is undefined, select recent modelId
      if (!botId) {
        setModelId(selectModel(recentUseModelId as Model));
        return;
      }

      // get botModelId from localStorage
      // When acquired from botModelID, settings for previousBotID are acquired, so a key is specified and acquired directly from local storage.
      const botModelId = localStorage.getItem(`bot_model_${botId}`);

      // modelId is in the the LocalStorage. use the saved modelId.
      if (botModelId) {
        setModelId(selectModel(botModelId as Model));
      } else {
        // If there is no bot-specific model ID, check if the last model used can be used
        const lastModelAvailable = filteredModels.some(
          (m: ModelItem) => m.modelId === recentUseModelId
        );

        // If the last model used is available, use it.
        if (lastModelAvailable) {
          setModelId(selectModel(recentUseModelId as Model));
          return;
        } else {
          // Use the default model if not available
          setModelId(selectModel(getDefaultModel()));
        }
      }
    } else {
      // Processing when botId and previousBotID are the same, but there is an update in FilteredModels
      if (botId) {
        const lastModelAvailable = filteredModels.some(
          (m: ModelItem) =>
            toCamelCase(m.modelId) === toCamelCase(recentUseModelId) ||
            toCamelCase(m.modelId) === toCamelCase(botModelId)
        );
        if (!lastModelAvailable) {
          setModelId(selectModel(getDefaultModel()));
        } else {
          setModelId(selectModel(recentUseModelId as Model));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId]);

  const model = useMemo(() => {
    return filteredModels.find(
      (model: ModelItem) => toCamelCase(model.modelId) === toCamelCase(modelId)
    );
  }, [filteredModels, modelId]);

  return {
    modelId,
    setModelId: (model: Model) => {
      setRecentUseModelId(model);
      if (botId) {
        setBotModelId(model);
      }
      setModelId(model);
    },
    model,
    disabledImageUpload: (model?.supportMediaType.length ?? 0) === 0,
    acceptMediaType:
      model?.supportMediaType.flatMap((mediaType: string) => {
        const ext = mediaType.split('/')[1];
        return ext === 'jpeg' ? ['.jpg', '.jpeg'] : [`.${ext}`];
      }) ?? [],
    availableModels: filteredModels,
    forceReasoningEnabled: model?.forceReasoningEnabled ?? false,
  };
};

export default useModel;
