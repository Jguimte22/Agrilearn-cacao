# Change DNS to Google DNS (May Fix Connection Issues)

## Steps:

1. Press `Windows + R`, type `ncpa.cpl`, press Enter
2. Right-click your active network connection (Wi-Fi or Ethernet)
3. Click **Properties**
4. Double-click **Internet Protocol Version 4 (TCP/IPv4)**
5. Select **"Use the following DNS server addresses"**
6. Enter:
   - Preferred DNS: `8.8.8.8`
   - Alternate DNS: `8.8.4.4`
7. Click **OK**, then **OK** again
8. Close all windows
9. Test connection again

## To Revert:
Select **"Obtain DNS server address automatically"** in step 5
