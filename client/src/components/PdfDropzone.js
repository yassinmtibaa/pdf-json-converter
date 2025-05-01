import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Text, VStack, Icon } from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';

const PdfDropzone = ({ onFileAccepted }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  return (
    <Box
      {...getRootProps()}
      p={10}
      border="2px dashed"
      borderColor={isDragActive ? 'blue.400' : 'gray.200'}
      borderRadius="lg"
      bg={isDragActive ? 'blue.50' : 'white'}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        borderColor: 'blue.400',
        bg: 'blue.50'
      }}
    >
      <input {...getInputProps()} />
      <VStack spacing={4}>
        <Icon as={FiUpload} w={10} h={10} color="gray.400" />
        <Text textAlign="center" color="gray.600">
          {isDragActive
            ? 'Drop the PDF file here'
            : 'Drag and drop a PDF file here, or click to select'}
        </Text>
      </VStack>
    </Box>
  );
};

export default PdfDropzone; 