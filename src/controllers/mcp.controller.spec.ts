/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { McpController } from './mcp.controller';
import { McpService, McpToolCall } from '../services/mcp.service';

describe('McpController', () => {
  let controller: McpController;
  let service: McpService;

  const mockService: Partial<Record<keyof McpService, jest.Mock>> = {
    getToolsDefinition: jest.fn(() => ['tool1', 'tool2']),
    handleToolCall: jest.fn().mockResolvedValue({
      content: 'Handled tool1',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [McpController],
      providers: [
        {
          provide: McpService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<McpController>(McpController);
    service = module.get<McpService>(McpService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTools', () => {
    it('should return tools definition', () => {
      const result = controller.getTools();
      expect(result).toEqual({ tools: ['tool1', 'tool2'] });
      expect(service.getToolsDefinition).toHaveBeenCalled();
    });
  });

  describe('callTool', () => {
    it('should call handleToolCall and return result', async () => {
      const request: McpToolCall = {
        name: 'tool1',
        arguments: {
          instruction: 'Please do something important',
          todoist_api_key: 'abc123',
        },
      };

      const result = await controller.callTool(request);

      expect(result).toEqual({
        content: 'Handled tool1',
      });
      expect(service.handleToolCall).toHaveBeenCalledWith(request);
    });

    it('should catch error and return fallback content', async () => {
      (mockService.handleToolCall as jest.Mock).mockRejectedValueOnce(
        new Error('Boom!'),
      );

      const request: McpToolCall = {
        name: 'badTool',
        arguments: {
          instruction: 'fail please',
          todoist_api_key: '123456',
        },
      };

      const result = await controller.callTool(request);
      expect(result).toEqual({
        content: '❌ Tool execution failed: Boom!',
        isError: true,
      });
    });
  });
});
