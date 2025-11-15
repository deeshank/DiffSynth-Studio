import { useState, useEffect } from 'react'
import {
  VStack,
  Box,
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
                size="sm"
              >
                <FormLabel mb={0} fontSize="sm">{param.label}</FormLabel>
              </Checkbox>
              <Collapse in={formData[`show_${key}`]}>
                <Textarea
                  value={formData[key] || ''}
                  onChange={(e) => updateFormData(key, e.target.value)}
                  placeholder={param.placeholder}
                  rows={param.rows || 3}
                  resize="vertical"
                  size="sm"
                  bg="gray.900"
                />
              </Collapse>
            </FormControl>
          )
        }
        return (
          <FormControl key={key}>
            <FormLabel fontSize="sm" fontWeight="semibold">{param.label}</FormLabel>
            <Textarea
              value={formData[key] || ''}
              onChange={(e) => updateFormData(key, e.target.value)}
              placeholder={param.placeholder}
              rows={param.rows || 3}
              resize="vertical"
              size="sm"
              bg="gray.900"
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
              <FormLabel fontSize="sm" fontWeight="semibold">
                {param.label}: <Text as="span" color="brand.400">{formData[key] || param.default}</Text>
              </FormLabel>
              <Slider
                value={formData[key] || param.default}
                onChange={(val) => updateFormData(key, val)}
                min={param.min}
                max={param.max}
                step={param.step || 1}
                size="sm"
              >
                <SliderTrack bg="gray.700">
                  <SliderFilledTrack bg="brand.500" />
                </SliderTrack>
                <SliderThumb boxSize={4} />
              </Slider>
              {param.help && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {param.help}
                </Text>
              )}
            </FormControl>
          )
        }

        if (param.label.includes('Width') || param.label.includes('Height')) {
          return (
            <FormControl key={key}>
              <FormLabel fontSize="sm" fontWeight="semibold">{param.label}</FormLabel>
              <Select
                value={formData[key] || param.default}
                onChange={(e) => updateFormData(key, Number(e.target.value))}
                size="sm"
                bg="gray.900"
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
            <FormLabel fontSize="sm" fontWeight="semibold">{param.label}</FormLabel>
            <NumberInput
              value={formData[key] || param.default}
              onChange={(_, val) => updateFormData(key, val)}
              min={param.min}
              max={param.max}
              size="sm"
            >
              <NumberInputField bg="gray.900" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            {param.help && (
              <Text fontSize="xs" color="gray.500" mt={1}>
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
    <VStack spacing={3} align="stretch">
      {/* Render all parameters dynamically */}
      {Object.entries(modelConfig.parameters)
        .filter(([_, param]) => !param.advanced && !param.img2img_only)
        .map(([key, param]) => renderControl(key, param))}

      {/* Seed Control - Collapsible */}
      <Box borderTop="1px" borderColor="gray.700" pt={3}>
        <Checkbox
          isChecked={formData.use_fixed_seed}
          onChange={(e) => updateFormData('use_fixed_seed', e.target.checked)}
          size="sm"
        >
          <Text fontSize="sm" fontWeight="semibold">🎲 Use Fixed Seed</Text>
        </Checkbox>
        <Collapse in={formData.use_fixed_seed}>
          <NumberInput
            value={formData.seed || 42}
            onChange={(_, val) => updateFormData('seed', val)}
            min={0}
            max={999999999}
            mt={2}
            size="sm"
          >
            <NumberInputField bg="gray.900" />
          </NumberInput>
        </Collapse>
      </Box>

      {/* Advanced Options - Collapsible */}
      {Object.entries(modelConfig.parameters).some(([_, param]) => param.advanced) && (
        <Box borderTop="1px" borderColor="gray.700" pt={3}>
          <Checkbox
            isChecked={formData.show_advanced}
            onChange={(e) => updateFormData('show_advanced', e.target.checked)}
            size="sm"
          >
            <Text fontSize="sm" fontWeight="semibold">⚙️ Advanced Options</Text>
          </Checkbox>
          <Collapse in={formData.show_advanced}>
            <VStack spacing={3} align="stretch" mt={3}>
              {Object.entries(modelConfig.parameters)
                .filter(([_, param]) => param.advanced)
                .map(([key, param]) => renderControl(key, param))}
            </VStack>
          </Collapse>
        </Box>
      )}

      {/* Generate Button */}
      <Button
        colorScheme="brand"
        size="md"
        onClick={handleGenerate}
        isLoading={mutation.isPending}
        loadingText="Generating..."
        isDisabled={!formData.prompt?.trim()}
        w="full"
        mt={2}
      >
        🚀 Generate Images
      </Button>
    </VStack>
  )
}

export default TextToImage
