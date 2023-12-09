﻿// Apache开源许可证
//
// 版权所有 © 2018-2023 1.8K仔
//
// 特此免费授予获得本软件及其相关文档文件（以下简称“软件”）副本的任何人以处理本软件的权利，
// 包括但不限于使用、复制、修改、合并、发布、分发、再许可、销售软件的副本，
// 以及允许拥有软件副本的个人进行上述行为，但须遵守以下条件：
//
// 在所有副本或重要部分的软件中必须包括上述版权声明和本许可声明。
//
// 软件按“原样”提供，不提供任何形式的明示或暗示的保证，包括但不限于对适销性、适用性和非侵权的保证。
// 在任何情况下，作者或版权持有人均不对任何索赔、损害或其他责任负责，
// 无论是因合同、侵权或其他方式引起的，与软件或其使用或其他交易有关。

using Fast.IaaS;
using Fast.SpecificationProcessor.DynamicApplication.Conventions;
using Fast.SpecificationProcessor.DynamicApplication.Formatters;
using Fast.SpecificationProcessor.DynamicApplication.Providers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;

namespace Fast.SpecificationProcessor.DynamicApplication.Extensions;

/// <summary>
/// <see cref="IServiceCollection"/> 动态API应用拓展类
/// </summary>
public static class DynamicApplicationIServiceCollectionExtension
{
    /// <summary>
    /// 添加动态接口控制器服务
    /// </summary>
    /// <param name="services"><see cref="IServiceCollection"/></param>
    /// <returns><see cref="IServiceCollection"/></returns>
    public static IServiceCollection AddDynamicApplication(this IServiceCollection services)
    {
        var partManager =
            services.FirstOrDefault(f => f.ServiceType == typeof(ApplicationPartManager))?.ImplementationInstance as
                ApplicationPartManager ?? throw new InvalidOperationException(
                $"`{nameof(AddDynamicApplication)}` must be invoked after `{nameof(MvcServiceCollectionExtensions.AddControllers)}`.");

        // 解决项目类型为 <Project Sdk="Microsoft.NET.Sdk"> 不能加载 API 问题，默认支持 <Project Sdk="Microsoft.NET.Sdk.Web">
        foreach (var assembly in FastContext.Assemblies)
        {
            if (partManager.ApplicationParts.Any(u => u.Name != assembly.GetName().Name))
            {
                partManager.ApplicationParts.Add(new AssemblyPart(assembly));
            }
        }

        // 添加控制器特性提供器
        partManager.FeatureProviders.Add(new DynamicApplicationFeatureProvider());

        // 配置 Mvc 选项
        services.Configure<MvcOptions>(options =>
        {
            // 添加应用模型转换器
            options.Conventions.Add(new DynamicApiControllerApplicationModelConvention(services));

            // 添加 text/plain 请求 Body 参数支持
            options.InputFormatters.Add(new TextPlainMediaTypeFormatter());
        });

        return services;
    }
}