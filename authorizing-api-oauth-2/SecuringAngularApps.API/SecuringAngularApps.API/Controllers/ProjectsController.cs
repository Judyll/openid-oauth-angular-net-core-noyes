using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using IdentityModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecuringAngularApps.API.Model;

namespace SecuringAngularApps.API.Controllers
{
    [Produces("application/json")]
    [Route("api/Projects")]
    [Authorize]
    public class ProjectsController : Controller
    {
        private readonly ProjectDbContext _context;

        public ProjectsController(ProjectDbContext context)
        {
            _context = context;
        }

        // GET: api/Projects
        [HttpGet]
        public IEnumerable<Project> GetProjects()
        {
            // (from c in User.Claims select new { c.Type, c.Value })
            //     .ToList().ForEach(c => Console.WriteLine($"{c.Type}: {c.Value}"));
            // return _context.Projects;

            /*JwtClaimTypes.Subject is equivalent to the "sub" claims. This is the 
            subject claims from the claims principle.
            */
            var userId = this.User.FindFirstValue(JwtClaimTypes.Subject);
            /*If we need to filter the projects based on the user, we just need a 
            relationship in the data model between the user id that comes from the 
            STS and the project. On this solution, that model is UserPermission.
            */
            List<int> userProjectIds = _context.UserPermissions.Where(up => up.ProjectId.HasValue
                && up.UserProfileId == userId).Select(up => up.ProjectId.Value).ToList();
            return _context.Projects.Where(p => userProjectIds.Contains(p.Id));
        }

        // GET: api/Projects/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject([FromRoute] int id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!await ProjectEditAccessCheck(id, false)) return Forbid();

            var project = await _context.Projects
                .Include("UserPermissions")
                .Include("Milestones")
                .FirstOrDefaultAsync(m => m.Id == id);

            if (project == null)
            {
                return NotFound();
            }

            return Ok(project);
        }

        [HttpGet("{id}/Users")]
        public async Task<IActionResult> GetProjectUsers([FromRoute] int id)
        {
            var perms = await _context.UserPermissions.Where(up => up.ProjectId == id).ToListAsync();
            var users = from u in _context.UserProfiles.Include("UserPermissions")
                        join p in perms
                        on u.Id equals p.UserProfileId
                        where p.Value != "Admin"
                        select u;
            return Ok(users);
        }

        // PUT: api/Projects/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProject([FromRoute] int id, [FromBody] Project project)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != project.Id)
            {
                return BadRequest();
            }

            if (!await ProjectEditAccessCheck(id, true)) return Forbid();

            _context.Entry(project).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProjectExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Projects
        [HttpPost]
        public async Task<IActionResult> PostProject([FromBody] Project project)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProject", new { id = project.Id }, project);
        }

        // DELETE: api/Projects/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject([FromRoute] int id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var project = await _context.Projects.SingleOrDefaultAsync(m => m.Id == id);
            if (project == null)
            {
                return NotFound();
            }
            var ups = _context.UserPermissions.Where(up => up.ProjectId == id).ToList();
            ups.ForEach(u => _context.UserPermissions.Remove(u));

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return Ok(project);
        }

        [HttpPost("Milestones")]
        public async Task<IActionResult> AddMilestone([FromBody] Milestone milestone)
        {
            var item = await _context.Milestones.FirstOrDefaultAsync(m => m.Id == milestone.Id);
            if (item != null) return StatusCode(409);
            if (!await MilestoneAccessCheck(item)) return Forbid();
            _context.Milestones.Add(milestone);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetProject", new { id = milestone.ProjectId }, milestone);
        }

        [HttpDelete("Milestones/{id}")]
        public async Task<IActionResult> DeleteMilestone(int id)
        {
            var item = await _context.Milestones.FirstOrDefaultAsync(m => m.Id == id);
            if (item == null) return NotFound();
            if (!await MilestoneAccessCheck(item)) return Forbid();
            _context.Milestones.Remove(item);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPut("Milestones/{id}")]
        public async Task<IActionResult> UpdateMilestone([FromBody] Milestone milestone, int id)
        {
            if (milestone.Id != id) return BadRequest();
            var item = await _context.Milestones.FirstOrDefaultAsync(ms => ms.Id == id);
            if (item == null) return NotFound();
            if (!await MilestoneAccessCheck(item)) return Forbid();
            item.MilestoneStatusId = milestone.MilestoneStatusId;
            item.Name = milestone.Name;
            await _context.SaveChangesAsync();
            return Ok(milestone);
        }

        /*User should be restricted to not add, edit, or delete milestones
        unless they have that permission. As discussed before, the only secure
        place to enforce that access is on the back-end. So,we will be adding
        an access control guard on the CRUD methods, and return the appropriate
        error is the user is not authorized to access those methods. To do that, it
        will depend on the app, framework and the permission mechanism you are using.
        In the case for this solution, we are using the simple UserPermission mapping
        object as part of the data model. So, we will add a helper method below that
        look up for the permission of the user and project based on the milestone
        that has been edited, and return the boolean flag whether they do or do not
        have permission.*/
        private async Task<bool> MilestoneAccessCheck(Milestone item) 
        {
            var userId = this.User.FindFirstValue(JwtClaimTypes.Subject);
            var perm = await _context.UserPermissions.FirstOrDefaultAsync(up =>
                up.ProjectId == item.ProjectId && up.UserProfileId == userId);
            return (perm != null && perm.Value == "Edit");
        }
        /*Some of the other operations in this controller should be restricted
        based on the user's permissions as well. So, we will add another helper method
        to check permissions for project level operations.*/
        private async Task<bool> ProjectEditAccessCheck(int projectId, bool edit) 
        {
            var userId = this.User.FindFirstValue(JwtClaimTypes.Subject);
            var userAccess = await _context.UserPermissions.FirstOrDefaultAsync(up =>
                up.ProjectId == projectId && up.UserProfileId == userId);
            return (userAccess != null && (edit ? userAccess.Value == "Edit" : true));
        }

        [HttpGet("MilestoneStatuses")]
        public IActionResult GetMilestoneStatuses()
        {
            return Ok(_context.MilestoneStatuses);
        }

        private bool ProjectExists(int id)
        {
            return _context.Projects.Any(e => e.Id == id);
        }

    }
}