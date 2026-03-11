import React, { createContext, useContext, useState } from 'react';
import { Menu, MenuItem, Divider } from '@mui/material';

const DropdownMenuContext = createContext(null);

export function DropdownMenu({ children }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const value = {
    anchorEl,
    open,
    openMenu: (el) => setAnchorEl(el),
    closeMenu: () => setAnchorEl(null),
  };

  return (
    <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild = false }) {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) return null;

  const handleClick = (e) => {
    ctx.openMenu(e.currentTarget);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        if (children.props.onClick) children.props.onClick(e);
        handleClick(e);
      },
    });
  }

  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, align = 'end', className, ...props }) {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) return null;

  const anchorOrigin = align === 'end' ? { vertical: 'top', horizontal: 'right' } : { vertical: 'top', horizontal: 'left' };
  const transformOrigin = align === 'end' ? { vertical: 'top', horizontal: 'right' } : { vertical: 'top', horizontal: 'left' };

  return (
    <Menu
      anchorEl={ctx.anchorEl}
      open={ctx.open}
      onClose={ctx.closeMenu}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      {...props}
    >
      {children}
    </Menu>
  );
}

export function DropdownMenuItem(props) {
  const ctx = useContext(DropdownMenuContext);
  return (
    <MenuItem
      onClick={(event) => {
        if (ctx) ctx.closeMenu();
        if (props.onClick) props.onClick(event);
      }}
      {...props}
    />
  );
}

export function DropdownMenuSeparator(props) {
  return <Divider sx={{ my: 0.5 }} {...props} />;
}

export default DropdownMenu;
