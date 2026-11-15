-- Add missing tables used by the contact and newsletter API. Preserve existing data.
USE AURALIE_FashionDB;
GO
IF OBJECT_ID('dbo.contact_inquiries', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.contact_inquiries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        full_name NVARCHAR(200) NOT NULL,
        email NVARCHAR(254) NOT NULL,
        phone NVARCHAR(50) NULL,
        service NVARCHAR(200) NULL,
        message NVARCHAR(MAX) NULL,
        status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO
IF OBJECT_ID('dbo.newsletter_subscribers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.newsletter_subscribers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(254) NOT NULL UNIQUE,
        name NVARCHAR(200) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        subscribed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO
