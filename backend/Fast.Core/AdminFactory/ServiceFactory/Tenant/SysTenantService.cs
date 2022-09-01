﻿using Fast.Core.AdminFactory.ServiceFactory.Tenant.Dto;
using Furion.DataEncryption;

namespace Fast.Core.AdminFactory.ServiceFactory.Tenant;

/// <summary>
/// 租户服务
/// </summary>
[ApiDescriptionSettings(Name = "Tenant", Order = 100)]
public class SysTenantService : ISysTenantService, IDynamicApiController, ITransient
{
    private readonly ISqlSugarRepository<SysTenantModel> _repository;
    private readonly ICache _cache;

    public SysTenantService(ISqlSugarRepository<SysTenantModel> repository, ICache cache)
    {
        _repository = repository;
        _cache = cache;
    }

    /// <summary>
    /// 分页查询租户信息
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    [HttpGet("sysTenant/page")]
    public async Task<PageResult<TenantOutput>> QueryTenantPageList([FromQuery] QueryTenantInput input)
    {
        return await _repository.Context.Queryable<SysTenantModel>().Where(wh => wh.TenantType != TenantTypeEnum.System)
            .WhereIF(!input.Name.IsEmpty(), wh => wh.Name.Contains(input.Name))
            .WhereIF(!input.AdminName.IsEmpty(), wh => wh.AdminName.Contains(input.AdminName))
            .WhereIF(!input.Phone.IsEmpty(), wh => wh.Phone.Contains(input.Phone)).OrderBy(ob => ob.CreatedTime)
            .OrderByIF(input.IsOrderBy, input.OrderByStr).Select<TenantOutput>().ToXnPagedListAsync(input.PageNo, input.PageSize);
    }

    /// <summary>
    /// 添加租户
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    [HttpPost("sysTenant/add")]
    public async Task AddTenant(AddTenantInput input)
    {
        // 判断租户信息是否存在
        if (await _repository.AnyAsync(wh => wh.Name == input.Name || wh.Email == input.Email))
            throw Oops.Bah(ErrorCode.TenantRepeatError);

        var model = input.Adapt<SysTenantModel>();
        model.Secret = StringUtil.GetGuid();
        model.TenantType = TenantTypeEnum.Common;

        // 判断租户密钥是否重复
        while (true)
        {
            if (await _repository.AnyAsync(wh => wh.Secret == model.Secret))
            {
                model.Secret = StringUtil.GetGuid();
            }
            else
            {
                break;
            }
        }

        await _repository.InsertAsync(model);
        // 删除缓存
        await _cache.DelAsync(CommonConst.CACHE_KEY_TENANT_INFO);
    }

    /// <summary>
    /// 初始化租户信息
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    [HttpPost("sysTenant/initTenantInfo")]
    public async Task InitTenantInfo(InitTenantInfoInput input)
    {
        // 判断是否存在租户
        var newTenantInfo = await _repository.FirstOrDefaultAsync(f => f.Id == input.Id);
        if (newTenantInfo.IsEmpty())
            throw Oops.Bah(ErrorCode.TenantNotExistError);

        // 查询是否存在数据库信息
        if (!await _repository.Context.Queryable<SysTenantDataBaseModel>()
                .AnyAsync(wh => wh.TenantId == input.Id && wh.SysDbType == SysDataBaseTypeEnum.Tenant))
            throw Oops.Bah(ErrorCode.TenantDbNotExistError);

        // 获取所有数据库Model
        var entityTypeList = SqlSugarConfig.ReflexGetAllTEntityList();

        // 初始化数据
        await InitNewTenant(newTenantInfo,
            entityTypeList.Where(wh => wh.dbType == SysDataBaseTypeEnum.Tenant).Select(sl => sl.type));

        // 删除缓存
        await _cache.DelAsync(CommonConst.CACHE_KEY_TENANT_INFO);
    }

    /// <summary>
    /// 初始化新租户数据
    /// </summary>
    /// <param name="newTenant"></param>
    /// <param name="entityTypeList">初始化Entity类型</param>
    /// <param name="isInit">是否为初始化</param>
    /// <returns></returns>
    [NonAction]
    public async Task InitNewTenant(SysTenantModel newTenant, IEnumerable<Type> entityTypeList, bool isInit = false)
    {
        var _db = GetService<ISqlSugarClient>().LoadSqlSugar<SysUserModel>(newTenant.Id);

        // 初始化数据库，判断是否存在
        if (_db.DbMaintenance.CreateDatabase())
        {
            // 初始化表结构
            foreach (var type in entityTypeList)
            {
                _db.CodeFirst.InitTables(type);
            }

            // 初始化公司（组织架构）
            var newAdminOrg = new SysOrgModel
            {
                ParentId = 0,
                ParentIds = new List<long> {0},
                Name = newTenant.Name,
                Code = "org_hq",
                Contacts = newTenant.AdminName,
                Tel = newTenant.Phone
            };
            newAdminOrg = await _db.Insertable(newAdminOrg).ExecuteReturnEntityAsync();

            var newAdminRole = new SysRoleModel
            {
                Name = RoleTypeEnum.AdminRole.GetDescription(),
                Code = "manager_role",
                Sort = 1,
                DataScopeType = DataScopeTypeEnum.All,
                RoleType = RoleTypeEnum.AdminRole
            };
            // 初始化租户管理员角色
            newAdminRole = await _db.Insertable(newAdminRole).ExecuteReturnEntityAsync();

            // 判断如果是初始化
            if (isInit)
            {
                // 初始化超级管理员
                await _db.Insertable(new SysUserModel
                {
                    Account = "SuperAdmin",
                    Password = MD5Encryption.Encrypt(CommonConst.DEFAULT_ADMIN_PASSWORD),
                    Name = "超级管理员",
                    NickName = "超级管理员",
                    Avatar = CommonConst.DEFAULT_Avatar_URL,
                    Sex = GenderEnum.Unknown,
                    Email = "superAdmin@18kboy.icu",
                    Phone = "18888888888",
                    AdminType = AdminTypeEnum.SuperAdmin
                }).ExecuteCommandAsync();
            }

            // 初始化租户系统管理员
            await _db.Insertable(new SysUserModel
            {
                Account = "SystemAdmin",
                Password = MD5Encryption.Encrypt(CommonConst.DEFAULT_ADMIN_PASSWORD),
                Name = "系统管理员",
                NickName = "系统管理员",
                Avatar = CommonConst.DEFAULT_Avatar_URL,
                Sex = GenderEnum.Unknown,
                Email = "systemAdmin@18kboy.icu",
                Phone = "15188888888",
                AdminType = AdminTypeEnum.SystemAdmin
            }).ExecuteCommandAsync();

            // 初始化租户管理员，账号以邮箱号码为准
            var newAdminUser = new SysUserModel
            {
                Account = newTenant.Email,
                Password = MD5Encryption.Encrypt(CommonConst.DEFAULT_ADMIN_PASSWORD),
                Name = newTenant.AdminName,
                NickName = newTenant.AdminName,
                Avatar = CommonConst.DEFAULT_Avatar_URL,
                Sex = GenderEnum.Unknown,
                Email = newTenant.Email,
                Phone = newTenant.Phone,
                AdminType = AdminTypeEnum.TenantAdmin
            };
            newAdminUser = await _db.Insertable(newAdminUser).ExecuteReturnEntityAsync();

            // 初始化职工
            await _db.Insertable(new SysEmpModel
            {
                Id = newAdminUser.Id, JobNum = "10001", OrgId = newAdminOrg.Id, OrgName = newAdminOrg.Name
            }).ExecuteCommandAsync();

            // 初始化用户角色
            await _db.Insertable(new SysUserRoleModel {SysUserId = newAdminUser.Id, SysRoleId = newAdminRole.Id})
                .ExecuteCommandAsync();

            // 初始化用户数据范围
            await _db.Insertable(new SysUserDataScopeModel {SysUserId = newAdminUser.Id, SysOrgId = newAdminOrg.Id,})
                .ExecuteCommandAsync();

            // 初始化角色数据范围
            await _db.Insertable(new SysRoleDataScopeModel {SysRoleId = newAdminRole.Id, SysOrgId = newAdminOrg.Id,})
                .ExecuteCommandAsync();

            await _cache.DelAsync(CommonConst.CACHE_KEY_USER_DATA_SCOPE);
            await _cache.DelAsync(CommonConst.CACHE_KEY_DATA_SCOPE);
        }
        else
        {
            throw Oops.Bah(ErrorCode.TenantDataBaseRepeatError);
        }
    }
}