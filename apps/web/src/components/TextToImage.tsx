import { useState, useEffect } from 'react'
import {
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Checkbox,
  useToast,
  Collapse,
} from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import { generateImages, GenerateRequest, ModelConfig } from '../services/api'

interface TextToImageProps {
  onGenerate: (images: string[], seed: number, time: number) => void
  modelId: string
  modelConfig: ModelConfig
}

function TextToImage({ onGenerate, modelId, modelConfig }: TextToImageProps) {
  const toast = useToast()
  const [formData, setFormData] = useState<Record<string, any>>({})

  // Initialize form data with defaults from model config
  useEffect(() => {
    const initialData: Record<string, any> = {}
    Object.entries(modelConfig.parameters).forEach(([key, param]) => {
      if (param.default !== undefined) {
        initialData[key] = param.default
      }
    })
    setFormData(initialData)
  }, [modelConfig])

  const mutation = useMutation({
    mutationFn: (data: GenerateRequest) => generateImages(modelId, data),
    onSuccess: (data) => {
      onGenerate(data.images, data.seed, data.generation_time)
      toast({
        title: 'Success!',
        description: `Generated ${data.images.length} image(s) in ${data.generation_time.toFixed(1)}s`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  const handleGenerate = () => {
    if (!formData.prompt?.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    const requestData: GenerateRequest = {
      prompt: formData.prompt,
      width: formData.width,
      height: formData.height,
      num_images: formData.num_images,
      steps: formData.steps,
    }

    // Add model-specific parameters
    if (modelId === 'sdxl') {
      requestData.negative_prompt = formData.negative_prompt
      requestData.cfg_scale = formData.cfg_scale
    } else if (modelId === 'flux') {
      requestData.guidance = formData.guidance
      requestData.tiled = formData.tiled
    }

    // Add optional seed
    if (formData.use_fixed_seed) {
      requestData.seed = formData.seed
    }

    mutation.mutate(requestData)
  }

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const renderControl = (key: string, param: any) => {
    // Skip img2img-only parameters
    if (param.img2img_only) return null

    switch (param.type) {
      case 'text':
        if (param.collapsible) {
          return (
            <FormControl key={key}>
              <Checkbox
                isChecked={formData[`show_${key}`]}
                onChange={(e) => updateFormData(`show_${key}`, e.target.checked)}
                mb={2}
              >
                <FormLabel mb={0}>{param.label}</FormLabel>
              </Checkbox>
              <Collapse in={formData[`show_${key}`]}>
                <Textarea
                  value={formData[key] || ''}
                  onChange={(e) => updateFormData(key, e.target.value)}
                  placeholder={param.placeholder}
                  rows={param.rows || 3}
                  resize="vertical"
                />
              </Collapse>
            </FormControl>
          )
        }
        return (
          <FormControl key={key}>
            <FormLabel>{param.label}</FormLabel>
            <Textarea
              value={formData[key] || ''}
              onChange={(e) => updateFormData(key, e.target.value)}
              placeholder={param.placeholder}
              rows={param.rows || 4}
              resize="vertical"
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              {(formData[key] || '').length} characters
            </Text>
          </FormControl>
        )

      case 'number':
        if (param.label.includes('Steps') || param.label.includes('CFG') || param.label.includes('Guidance')) {
          return (
            <FormControl key={key}>
              <FormLabel>
                {param.label}: {formData[key] || param.default}
              </FormLabel>
              <Slider
                value={formData[key] || param.default}
                onChange={(val) => updateFormData(key, val)}
                min={param.min}
                max={param.max}
                step={param.step || 1}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              {param.help && (
                <Text fontSize="xs" color="gray.500">
                  {param.help}
                </Text>
              )}
            </FormControl>
          )
        }

        if (param.label.includes('Width') || param.label.includes('Height')) {
          return (
            <FormControl key={key}>
              <FormLabel>{param.label}</FormLabel>
              <Select
                value={formData[key] || param.default}
                onChange={(e) => updateFormData(key, Number(e.target.value))}
              >
                {param.presets?.map((preset: number) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </Select>
            </FormControl>
          )
        }

        return (
          <FormControl key={key}>
            <FormLabel>{param.label}</FormLabel>
            <NumberInput
              value={formData[key] || param.default}
              onChange={(_, val) => updateFormData(key, val)}
              min={param.min}
              max={param.max}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            {param.help && (
              <Text fontSize="xs" color="gray.500">
                {param.help}
              </Text>
            )}
          </FormControl>
        )

      case 'boolean':
        return (
          <FormControl key={key}>
            <Checkbox
              isChecked={formData[key] || param.default}
              onChange={(e) => updateFormData(key, e.target.checked)}
            >
              {param.label}
            </Checkbox>
            {param.help && (
              <Text fontSize="xs" color="gray.500" ml={6}>
                {param.help}
              </Text>
            )}
          </FormControl>
        )

      default:
        return null
    }
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Render all parameters dynamically */}
      {Object.entries(modelConfig.parameters)
        .filter(([_, param]) => !param.advanced && !param.img2img_only)
        .map(([key, param]) => renderControl(key, param))}

      {/* Seed Control */}
      <FormControl>
        <Checkbox
          isChecked={formData.use_fixed_seed}
          onChange={(e) => updateFormData('use_fixed_seed', e.target.checked)}
        >
          Use Fixed Seed
        </Checkbox>
        {formData.use_fixed_seed && (
          <NumberInput
            value={formData.seed || 42}
            onChange={(_, val) => updateFormData('seed', val)}
            min={0}
            max={999999999}
            mt={2}
          >
            <NumberInputField />
          </NumberInput>
        )}
      </FormControl>

      {/* Advanced Options */}
      {Object.entries(modelConfig.parameters).some(([_, param]) => param.advanced) && (
        <FormControl>
          <Checkbox
            isChecked={formData.show_advanced}
            onChange={(e) => updateFormData('show_advanced', e.target.checked)}
          >
            <FormLabel mb={0}>Advanced Options</FormLabel>
          </Checkbox>
          <Collapse in={formData.show_advanced}>
            <VStack spacing={4} align="stretch" mt={4}>
              {Object.entries(modelConfig.parameters)
                .filter(([_, param]) => param.advanced)
                .map(([key, param]) => renderControl(key, param))}
            </VStack>
          </Collapse>
        </FormControl>
      )}

      {/* Generate Button */}
      <Button
        colorScheme="brand"
        size="lg"
        onClick={handleGenerate}
        isLoading={mutation.isPending}
        loadingText="Generating..."
        isDisabled={!formData.prompt?.trim()}
      >
        🚀 Generate Images
      </Button>
    </VStack>
  )
}

export default TextToImage
