import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import Link from "@fuse/core/Link";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import {  alpha } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import clsx from "clsx";
import Popover from "@mui/material/Popover";
import { logoutUser , getUser} from "@/utils/auth";
import { useRouter } from "next/navigation";

const mockUser = {
  displayName: "John Doe",
  email: "johndoe@example.com",
  photoURL: "https://via.placeholder.com/150",
  role: "Admin",
  isGuest: false,
};

function UserMenu({
  className,
  popoverProps,
  arrowIcon = "heroicons-outline:chevron-up",
}) {
  const [userMenu, setUserMenu] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
  }, []);
  console.log("user", user);

  const userMenuClick = (event) => {
    setUserMenu(event.currentTarget);
  };
  const userMenuClose = () => {
    setUserMenu(null);
  };
  // const signOut = () => {
  //   console.log("Signing out...");
  //   setUserMenu(null);
  // };

  const router = useRouter();

  // const handleLogout = () => {
  //   logoutUser(router);
  // };

  const handleLogout = () => {
    logoutUser(); // Remove 'router' argument
    router.push("/sign-in"); // Correct way to navigate
  };

  return (
    <>
      <Button
        className={clsx(
          "user-menu flex justify-start shrink-0 min-h-14 h-14 rounded-lg p-2 space-x-3",
          className,
        )}
        sx={(theme) => ({
          borderColor: theme.palette.divider,
          "&:hover, &:focus": {
            backgroundColor: alpha(theme.palette.divider, 0.6),
            ...theme.applyStyles?.("dark", {
              backgroundColor: alpha(theme.palette.divider, 0.1),
            }),
          },
        })}
        onClick={userMenuClick}
        color="inherit"
      >
        {mockUser.photoURL ? (
          <Avatar
            className="avatar w-10 h-10 rounded-lg"
            alt="User Photo"
            src={mockUser.photoURL}
            variant="rounded"
          />
        ) : (
          <Avatar className="avatar md:mx-1">{user.displayName[0]}</Avatar>
        )}

        <div className="flex flex-col flex-auto space-y-2">
          <Typography
            component="span"
            className="title flex font-semibold text-base capitalize truncate"
          >
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography
            className="subtitle flex text-md font-medium tracking-tighter leading-none"
            color="text.secondary"
          >
            {user?.email}
          </Typography>
        </div>

        <div className="flex shrink-0 items-center space-x-2">
          <FuseSvgIcon className="arrow" size={13}>
            {arrowIcon}
          </FuseSvgIcon>
        </div>
      </Button>

      <Popover
        open={Boolean(userMenu)}
        anchorEl={userMenu}
        onClose={userMenuClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        classes={{ paper: "py-2 min-w-64 bg-[#E8E8E8] text-black" }}
        {...popoverProps}
      >
        {mockUser.isGuest ? (
          <>
            <MenuItem component={Link} to="/sign-in" role="button">
              <ListItemIcon className="min-w-9">
                <FuseSvgIcon>heroicons-outline:lock-closed</FuseSvgIcon>
              </ListItemIcon>
              <ListItemText primary="Sign In" />
            </MenuItem>
            <MenuItem component={Link} to="/sign-up" role="button">
              <ListItemIcon className="min-w-9">
                <FuseSvgIcon>heroicons-outline:user-plus</FuseSvgIcon>
              </ListItemIcon>
              <ListItemText primary="Sign up" />
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem
              component={Link}
              to="/apps/profile"
              onClick={userMenuClose}
              role="button"
            >
              <ListItemIcon className="min-w-9 text-black">
                <FuseSvgIcon>heroicons-outline:user-circle</FuseSvgIcon>
              </ListItemIcon>
              <ListItemText primary="My Profile" />
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon className="min-w-9 text-black">
                <FuseSvgIcon>
                  heroicons-outline:arrow-right-on-rectangle
                </FuseSvgIcon>
              </ListItemIcon>
              <ListItemText primary="Sign out" />
            </MenuItem>
          </>
        )}
      </Popover>
    </>
  );
}

export default UserMenu;
