import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import MainProjectSelection from "@/components/MainProjectSelection";
import Link from "next/link";

const Root = styled("div")(({ theme }) => ({
  "& > .logo-icon": {
    transition: theme.transitions.create(["width", "height"], {
      duration: theme.transitions.duration.shortest,
      easing: theme.transitions.easing.easeInOut,
    }),
  },
  "& > .badge": {
    transition: theme.transitions.create("opacity", {
      duration: theme.transitions.duration.shortest,
      easing: theme.transitions.easing.easeInOut,
    }),
  },
}));

/**
 * The logo component.
 */
function Logo() {
  return (
    <Root className="flex flex-1 items-center space-x-3">
      <div className="flex flex-1 items-center space-x-2 px-2.5">
        <div
          onClick={() => window.open("https://vapehub.devateam.com/", "_blank")}
          className="cursor-pointer flex items-center"
        >
          <img
            className="logo-icon min-h-32 w-32"
            src="/assets/images/logo/logo.svg"
            alt="logo"
          />
        </div>
      </div>
    </Root>
  );
}

export default Logo;
