module.exports = {
  requestSuccessData: (validUser, accessToken) => {
    const userValue = {
      status: true,
      contents: {
        id: validUser._id,
        name: validUser.name,
        email: validUser.email,
        created_at: validUser.created_at,
      },
    };
    if (accessToken) userValue.meta = { access_token: accessToken };
    return userValue;
  },

  requestCommunityData: async (validUser, pagination) => {
    const userValue = {
      status: true,
    };

    if (pagination) {
      userValue.content = {
        meta: {
          total: pagination.len,
          pages: Math.ceil(pagination.len / pagination.limit),
          page: pagination.page,
        },
        data: await validUser.toArray(),
      };
    } else {
      userValue.content = {
        data: {
          id: validUser._id,
          name: validUser.name,
          slug: validUser.slug,
          owner: validUser.owner.id,
          created_at: validUser.created_at,
          updated_at: validUser.updated_at,
        },
      };
    }

    return userValue;
  },

  requestRoleData: async (validRole, pagination) => {
    const roleValue = {
      status: true,
    };

    if (pagination) {
      roleValue.content = {
        meta: {
          total: pagination.len,
          pages: Math.ceil(pagination.len / pagination.limit),
          page: pagination.page,
        },
        data: await validRole.toArray(),
      };
    } else {
      roleValue.content = {
        data: {
          id: validRole._id,
          name: validRole.name,
          created_at: validRole.created_at,
          updated_at: validRole.updated_at,
        },
      };
    }

    return roleValue;
  },
  errorData: (param, message, code) => {
    const errorValue = {
      status: false,
      errors: [
        {
          ...(param && { param: param }),
          message: message,
          code: code,
        },
      ],
    };
    return errorValue;
  },
};
