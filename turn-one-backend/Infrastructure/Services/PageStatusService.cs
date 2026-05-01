using Application.Interfaces;
using Domain.Entities;
using Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class PageStatusService : IPageStatusService
    {
        private readonly TurnOneDbContext _context;

        public PageStatusService(TurnOneDbContext context)
        {
            _context = context;
        }

        public async Task<List<PageStatus>> GetAllPageStatusesAsync()
        {
            return await _context.PageStatuses.ToListAsync();
        }

        public async Task<PageStatus?> GetPageStatusAsync(string pageName)
        {
            return await _context.PageStatuses.FirstOrDefaultAsync(p => p.PageName == pageName);
        }

        public async Task<PageStatus> UpdatePageStatusAsync(string pageName, bool isClosed, string maintenanceMessage)
        {
            var pageStatus = await _context.PageStatuses.FirstOrDefaultAsync(p => p.PageName == pageName);

            if (pageStatus == null)
            {
                pageStatus = new PageStatus
                {
                    PageName = pageName,
                    IsClosed = isClosed,
                    MaintenanceMessage = maintenanceMessage
                };
                _context.PageStatuses.Add(pageStatus);
            }
            else
            {
                pageStatus.IsClosed = isClosed;
                pageStatus.MaintenanceMessage = maintenanceMessage;
            }

            await _context.SaveChangesAsync();
            return pageStatus;
        }
    }
}
