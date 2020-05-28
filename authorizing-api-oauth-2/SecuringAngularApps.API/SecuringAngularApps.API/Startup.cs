using System;
using System.Linq;
using IdentityServer4.AccessTokenValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SecuringAngularApps.API.Model;

namespace SecuringAngularApps.API
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddDbContext<ProjectDbContext>(options =>
                options.UseSqlServer(Configuration.GetConnectionString("ProjectDbContext")));
            services.AddCors(options =>
            {
                options.AddPolicy("AllRequests", builder =>
                {
                    builder.AllowAnyHeader()
                    .AllowAnyMethod()
                    /*This fixes the error:
                    The CORS protocol does not allow specifying wildcard (any) origin
                    and credentials at the same time.
                    */
                    .SetIsOriginAllowed(origin => origin == "http://localhost:4200")
                    .AllowCredentials();
                });
            });
            /*Using the Microsoft Authentication middleware sets default mapping URIs for the 
            claims that have named URIs associated with them. For example:
            http://schemas.microsoft.com/ws/2008/06/identity/claims/role: Admin
            http://schemas.microsoft.com/claims/authmethodsreferences: pwd
            This is not really a great thing since you can tell by the years in some of these urls
            the mapping are quite outdated or not part of the OAuth 2.0 spec.
            So, we are going to switch from a Microsoft Authentication Middleware to a wrapper
            around that provided by the IdentityServer4 which is the IdentityServer4.AccessTokenValidation.
            We will now use the IdentityServer's helper methods instead of the Microsoft ones.
            */
            // services.AddAuthentication("Bearer")
            //     .AddJwtBearer("Bearer", options => {
            //         options.Authority = "http://localhost:4242";
            //         options.Audience = "projects-api";
            //         options.RequireHttpsMetadata = false;
            //     });            
            services.AddAuthentication(IdentityServerAuthenticationDefaults.AuthenticationScheme)
                .AddIdentityServerAuthentication(options => {
                    options.Authority = "http://localhost:4242";
                    options.ApiName = "projects-api";
                    options.RequireHttpsMetadata = false;
                });
            /* Making the whole site secure by default by adding a global authentication
               filter to the host. This is done by expanding the AddMvc() call. In the 
               callback lamba expression, an new authorization policy is created that requires
               users to be authenticated and then add that to the filters for the host. 
            */
            services.AddMvc(options => {
                var policy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
                options.Filters.Add(new AuthorizeFilter(policy));
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            app.UseCors("AllRequests");
            app.UseAuthentication();
            app.UseMvc();
        }
    }
}
