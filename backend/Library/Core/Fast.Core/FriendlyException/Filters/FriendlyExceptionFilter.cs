﻿using Fast.Core.DataValidation;
using Fast.Core.DataValidation.Filters;
using Fast.Core.DynamicApiController.Internal;
using Fast.Core.FriendlyException.Exceptions;
using Fast.Core.FriendlyException.Handlers;
using Fast.Core.FriendlyException.Options;
using Fast.Core.FriendlyException.Results;
using Fast.Core.UnifyResult;
using Fast.IaaS.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Fast.Core.FriendlyException.Filters;

/// <summary>
/// 友好异常拦截器
/// </summary>
public sealed class FriendlyExceptionFilter : IAsyncExceptionFilter
{
    /// <summary>
    /// 异常拦截
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    public async Task OnExceptionAsync(ExceptionContext context)
    {
        // 判断是否是验证异常
        var isValidationException =
            context.Exception is AppFriendlyException friendlyException && friendlyException.ValidationException;

        // 只有不是验证异常才处理
        if (!isValidationException)
        {
            // 解析异常处理服务，实现自定义异常额外操作，如记录日志等
            var globalExceptionHandler = context.HttpContext.RequestServices.GetService<IGlobalExceptionHandler>();
            if (globalExceptionHandler != null)
            {
                await globalExceptionHandler.OnExceptionAsync(context);
            }
        }

        // 排除 WebSocket 请求处理
        if (context.HttpContext.IsWebSocketRequest())
            return;

        // 如果异常在其他地方被标记了处理，那么这里不再处理
        if (context.ExceptionHandled)
            return;

        // 解析异常信息
        var exceptionMetadata = UnifyContext.GetExceptionMetadata(context);

        // 判断是否是 Razor Pages
        var isPageDescriptor = context.ActionDescriptor is CompiledPageActionDescriptor;

        // 判断是否是验证异常，如果是，则不处理
        if (isValidationException)
        {
            var resultHttpContext = context.HttpContext.Items[nameof(DataValidationFilter) + nameof(AppFriendlyException)];
            // 读取验证执行结果
            if (resultHttpContext != null)
            {
                var result = isPageDescriptor
                    ? (resultHttpContext as PageHandlerExecutedContext).Result
                    : (resultHttpContext as ActionExecutedContext).Result;

                // 直接将验证结果设置为异常结果
                context.Result = result ?? new BadPageResult(StatusCodes.Status400BadRequest)
                {
                    Code = ValidatorContext.GetValidationMetadata((context.Exception as AppFriendlyException).ErrorMessage)
                        .Message
                };

                // 标记验证异常已被处理
                context.ExceptionHandled = true;
                return;
            }
        }

        // 处理 Razor Pages
        if (isPageDescriptor)
        {
            // 返回自定义错误页面
            context.Result =
                new BadPageResult(isValidationException ? StatusCodes.Status400BadRequest : exceptionMetadata.StatusCode)
                {
                    Title = isValidationException ? "ModelState Invalid" : ("Internal Server: " + exceptionMetadata.Errors),
                    Code = isValidationException
                        ? ValidatorContext.GetValidationMetadata((context.Exception as AppFriendlyException).ErrorMessage)
                            .Message
                        : context.Exception.ToString()
                };
        }
        // Mvc/WebApi
        else
        {
            // 获取控制器信息
            var actionDescriptor = context.ActionDescriptor as ControllerActionDescriptor;

            // 判断是否跳过规范化结果，如果是，则只处理为友好异常消息
            if (UnifyContext.CheckFailedNonUnify(actionDescriptor.MethodInfo, out var unifyResult))
            {
                // WebAPI 情况
                if (Penetrates.IsApiController(actionDescriptor.MethodInfo.DeclaringType))
                {
                    // 返回 JsonResult
                    context.Result = new JsonResult(exceptionMetadata.Errors) {StatusCode = exceptionMetadata.StatusCode,};
                }
                else
                {
                    // 返回自定义错误页面
                    context.Result = new BadPageResult(exceptionMetadata.StatusCode)
                    {
                        Title = "Internal Server: " + exceptionMetadata.Errors, Code = context.Exception.ToString()
                    };
                }
            }
            else
            {
                // 判断是否支持 MVC 规范化处理
                if (!UnifyContext.CheckSupportMvcController(context.HttpContext, actionDescriptor, out _))
                    return;

                // 执行规范化异常处理
                context.Result = unifyResult.OnException(context, exceptionMetadata);
            }
        }

        // 读取异常配置
        var friendlyExceptionSettings =
            context.HttpContext.RequestServices.GetRequiredService<IOptions<FriendlyExceptionSettingsOptions>>();

        // 判断是否启用异常日志输出
        if (friendlyExceptionSettings.Value.LogError == true)
        {
            // 创建日志记录器
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Internal.FriendlyException>>();

            // 记录拦截日常
            logger.LogError(context.Exception, context.Exception.Message);
        }
    }
}